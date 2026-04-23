import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/lib/auth/hook';

import { getMe } from './service';

export function useMe() {
  const session = useSession();
  return useQuery({
    queryKey: ['user', 'me', session?.token ?? 'anon'],
    queryFn: getMe,
    enabled: Boolean(session),
  });
}
