declare module '@supabase/supabase-js' {
  export type User = {
    id: string;
    email?: string;
    phone?: string;
    app_metadata: Record<string, any>;
    user_metadata: Record<string, any>;
    aud: string;
    created_at: string;
    [key: string]: any;
  };

  export type Session = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: User;
    [key: string]: any;
  };

  export type AuthChangeEvent =
    | 'SIGNED_IN'
    | 'SIGNED_OUT'
    | 'TOKEN_REFRESHED'
    | 'USER_UPDATED'
    | 'PASSWORD_RECOVERY'
    | 'INITIAL_SESSION';

  export type SupabaseClientOptions<SchemaName> = {
    auth?: Record<string, any>;
    db?: { schema?: SchemaName };
    global?: Record<string, any>;
    [key: string]: any;
  };

  export type SupabaseClient<
    Database = any,
    SchemaName extends string = 'public',
    Schema = Database extends { public: infer P } ? P : any
  > = {
    auth: {
      getSession(): Promise<{ data: { session: Session | null }; error: any }>;
      getUser(): Promise<{ data: { user: User | null }; error: any }>;
      signUp(credentials: any): Promise<any>;
      signInWithPassword(credentials: any): Promise<any>;
      signInWithOAuth(credentials: any): Promise<any>;
      signOut(): Promise<any>;
      resetPasswordForEmail(email: string, options?: any): Promise<any>;
      updateUser(attributes: any): Promise<any>;
      onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): { data: { subscription: { unsubscribe(): void } } };
      [key: string]: any;
    };
    from(table: string): any;
    storage: { from(bucket: string): any; [key: string]: any };
    functions: { invoke(name: string, options?: any): Promise<any>; [key: string]: any };
    channel(name: string): any;
    removeChannel(channel: any): any;
    [key: string]: any;
  };

  export function createClient<
    Database = any,
    SchemaName extends string = 'public'
  >(
    url: string,
    key: string,
    options?: SupabaseClientOptions<SchemaName>
  ): SupabaseClient<Database, SchemaName>;
}
