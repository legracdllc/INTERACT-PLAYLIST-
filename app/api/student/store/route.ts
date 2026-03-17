import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStoreItem } from "@/lib/store";

const purchaseSchema = z.object({
  action: z.literal("purchase"),
  itemKey: z.string().min(1),
});

const equipSchema = z.object({
  action: z.literal("equip"),
  itemKey: z.string().min(1),
});

const schema = z.union([purchaseSchema, equipSchema]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid store payload." }, { status: 400 });
  }

  const supabase = await createClient();
  const service = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const item = getStoreItem(parsed.data.itemKey);
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const { data: wallet } = await service.from("wallets").select("coins").eq("student_id", user.id).maybeSingle<{ coins: number }>();
  const { data: existing } = await service
    .from("student_inventory")
    .select("item_key,item_type,is_equipped")
    .eq("student_id", user.id)
    .eq("item_key", item.key)
    .maybeSingle<{ item_key: string; item_type: string; is_equipped: boolean }>();

  if (parsed.data.action === "purchase") {
    if (existing?.item_key) {
      return NextResponse.json({ ok: true, owned: true }, { status: 200 });
    }

    const currentCoins = wallet?.coins ?? 0;
    if (currentCoins < item.cost) {
      return NextResponse.json({ error: "Not enough coins." }, { status: 400 });
    }

    await service.from("wallets").upsert({ student_id: user.id, coins: currentCoins - item.cost });
    const { error } = await service.from("student_inventory").insert({
      student_id: user.id,
      item_key: item.key,
      item_type: item.type,
      cost_coins: item.cost,
      source: "store",
      is_equipped: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, purchased: true });
  }

  if (!existing?.item_key) {
    return NextResponse.json({ error: "Buy the item before equipping it." }, { status: 400 });
  }

  await service
    .from("student_inventory")
    .update({ is_equipped: false })
    .eq("student_id", user.id)
    .eq("item_type", item.type);

  const { error } = await service
    .from("student_inventory")
    .update({ is_equipped: true })
    .eq("student_id", user.id)
    .eq("item_key", item.key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, equipped: true });
}
