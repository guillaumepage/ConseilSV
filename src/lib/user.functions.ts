import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAILS = new Set(["guillaume.page09@gmail.com", "noemie.duval@hotmail.com"]);

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const ensureMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await getAdminClient();
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (userError) throw new Error(userError.message);

    const email = userData.user?.email ?? context.claims.email;
    if (!email) throw new Error("Courriel introuvable");

    const { data: existingProfile, error: profileReadError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileReadError) throw new Error(profileReadError.message);

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: context.userId,
        email,
        full_name: (userData.user?.user_metadata?.full_name as string | undefined) ?? null,
      });
      if (profileError) throw new Error(profileError.message);
    }

    const normalizedEmail = email.toLowerCase();
    const role = ADMIN_EMAILS.has(normalizedEmail) ? "admin" : "user";
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(roleError.message);

    return { ok: true };
  });