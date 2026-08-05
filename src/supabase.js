import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zrhyhmzlfuptevcmjcmk.supabase.co'
const supabaseKey = 'sb_publishable_KR9m_qBMjhBdu2YiTwUkAA_P-6AU_yd'

export const supabase = createClient(supabaseUrl, supabaseKey)
