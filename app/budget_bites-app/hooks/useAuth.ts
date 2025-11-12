import { useState, useEffect } from 'react';

import { supabase } from '../lib/supabase';
import { ServiceFactory } from '../factories/serviceFactory';

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAuthState();

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const authRepo = ServiceFactory.getAuthRepository();

            if (session) {
                await authRepo.update({
                    is_logged_in: true,
                    user_id: session.user.id,
                    email: session.user.email,
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                });
                setIsLoggedIn(true);
            } else {
                await authRepo.update({
                    is_logged_in: false,
                    user_id: undefined,
                    email: undefined,
                    access_token: undefined,
                    refresh_token: undefined,
                });
                setIsLoggedIn(false);
            }
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    const loadAuthState = async () => {
        try {
            const authService = ServiceFactory.createAuthService();
            const authenticated = await authService.isAuthenticated();
            setIsLoggedIn(authenticated);

            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setIsLoggedIn(true);
            }
        } catch (error) {
            console.error('Auth state取得エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    return { isLoggedIn, loading };
}