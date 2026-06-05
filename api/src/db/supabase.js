import { createClient } from "@supabase/supabase-js"
import { config } from "../../config.js"

const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SECRET
)

export default supabase