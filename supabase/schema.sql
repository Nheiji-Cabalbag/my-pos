create extension if not exists "pgcrypto";

create table products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  product_price numeric(10,2) not null check (product_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  total_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_updated before update on products
  for each row execute function set_updated_at();

-- Atomic checkout: items = [{"product_id": "...", "quantity": 2}, ...]
create function checkout(items jsonb) returns uuid
language plpgsql as $$
declare
  tx_id uuid; it jsonb; p products%rowtype; qty int; total numeric(10,2) := 0;
begin
  if jsonb_array_length(items) = 0 then raise exception 'Cart is empty'; end if;
  insert into transactions (total_amount) values (0) returning id into tx_id;
  for it in select * from jsonb_array_elements(items) loop
    qty := (it->>'quantity')::int;
    select * into p from products where id = (it->>'product_id')::uuid for update;
    if not found then raise exception 'Product no longer exists'; end if;
    if qty <= 0 or p.stock_quantity < qty then
      raise exception 'Not enough stock for %', p.product_name;
    end if;
    update products set stock_quantity = stock_quantity - qty where id = p.id;
    insert into transaction_items
      (transaction_id, product_id, product_name, quantity, unit_price, subtotal)
      values (tx_id, p.id, p.product_name, qty, p.product_price, p.product_price * qty);
    total := total + p.product_price * qty;
  end loop;
  update transactions set total_amount = total where id = tx_id;
  return tx_id;
end $$;

-- Storage bucket for product images (public read)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict do nothing;

-- Row Level Security. Personal app: only signed-in users may read/write.
alter table products enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;
create policy "auth all" on products for all to authenticated using (true) with check (true);
create policy "auth all" on transactions for all to authenticated using (true) with check (true);
create policy "auth all" on transaction_items for all to authenticated using (true) with check (true);
create policy "public read images" on storage.objects for select using (bucket_id = 'product-images');
create policy "auth write images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images') with check (bucket_id = 'product-images');
