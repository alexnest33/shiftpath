alter type public.schedule_type add value if not exists '5_2';
alter type public.schedule_type add value if not exists '1_3';

alter table public.schedules
drop constraint if exists schedules_preset_pattern_check;

alter table public.schedules
add constraint schedules_preset_pattern_check
check (
  (schedule_type::text = '2_2' and cycle_pattern = array[true, true, false, false])
  or (
    schedule_type::text = '3_3'
    and cycle_pattern = array[true, true, true, false, false, false]
  )
  or (
    schedule_type::text = '2_2_3'
    and cycle_pattern = array[
      true, true, false, false, true, true, true,
      false, false, true, true, false, false, false
    ]
  )
  or (
    schedule_type::text = '5_2'
    and cycle_pattern = array[true, true, true, true, true, false, false]
  )
  or (
    schedule_type::text = '1_3'
    and cycle_pattern = array[true, false, false, false]
  )
  or schedule_type::text = 'custom'
);
