'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateSelfCheckoutEnabled(newValue: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('shops')
    .update({ self_checkout_enabled: newValue })
    .eq('owner_id', user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
