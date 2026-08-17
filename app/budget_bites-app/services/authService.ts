
import { supabase } from '../lib/supabase';
import { AuthRepository } from '../repositories/authRepository';


export class AuthService {
    private authRepo: AuthRepository;
    constructor(authRepo: AuthRepository) {
        this.authRepo = authRepo;
    }

    async signIn(email: string, password: string): Promise<void> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        await this.authRepo.update({
            is_logged_in: true,
            user_id: data.user.id,
            email: data.user.email,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        });
    }

    async signUp(email: string, password: string): Promise<void> {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    }

    async signOut(): Promise<void> {
        await supabase.auth.signOut();
        await this.authRepo.update({
            is_logged_in: false,
            user_id: undefined,
            email: undefined,
            access_token: undefined,
            refresh_token: undefined,
        });
    }

    async isAuthenticated(): Promise<boolean> {
        const auth = await this.authRepo.get();
        return auth.is_logged_in;
    }
}