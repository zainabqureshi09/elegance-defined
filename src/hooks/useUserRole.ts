import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setRoles([]);
      setChecking(false);
      return;
    }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as string));
        setChecking(false);
      });
  }, [user, loading]);

  return {
    isAdmin: roles.includes('admin'),
    roles,
    loading: loading || checking,
  };
};
