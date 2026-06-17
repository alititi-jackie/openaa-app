delete from public.admin_user_modules
where module_key = 'support';

delete from public.admin_module_permissions
where module_key = 'support'
   or permission_key in (
     'view_support_tickets',
     'handle_support_tickets',
     'view_feedback',
     'handle_feedback',
     'view_reports',
     'handle_reports',
     'view_post_reports',
     'handle_post_reports',
     'manage_system_announcements',
     'manage_notifications'
   );

delete from public.admin_user_permissions
where permission_key in (
  'view_support_tickets',
  'handle_support_tickets',
  'view_feedback',
  'handle_feedback',
  'view_reports',
  'handle_reports',
  'view_post_reports',
  'handle_post_reports',
  'manage_system_announcements',
  'manage_notifications'
);

delete from public.admin_role_permissions
where permission_key in (
  'view_support_tickets',
  'handle_support_tickets',
  'view_feedback',
  'handle_feedback',
  'view_reports',
  'handle_reports',
  'view_post_reports',
  'handle_post_reports',
  'manage_system_announcements',
  'manage_notifications'
);

delete from public.admin_permissions
where permission_key in (
  'view_support_tickets',
  'handle_support_tickets',
  'view_feedback',
  'handle_feedback',
  'view_reports',
  'handle_reports',
  'view_post_reports',
  'handle_post_reports',
  'manage_system_announcements',
  'manage_notifications'
);
