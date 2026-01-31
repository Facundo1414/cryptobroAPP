import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  LoginResponse,
  RegisterResponse,
  AuthUser,
  AuthTokens,
} from "./auth.types";

/**
 * AuthService - Supabase Authentication
 *
 * Simple authentication using Supabase Auth directly.
 * No local bcrypt/jwt - uses Supabase's built-in auth system.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseServiceKey = this.configService.get<string>(
      "SUPABASE_SERVICE_KEY",
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL and Service Key must be configured");
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log("Supabase Auth Service initialized");
  }

  /**
   * Register a new user using Supabase Auth
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, password, name } = registerDto;

    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { name: name || email.split("@")[0] },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new ConflictException("Email already registered");
        }
        throw new UnauthorizedException(error.message);
      }

      // Now login to get the tokens
      const loginResult = await this.login({ email, password });

      this.logger.log(`User registered successfully: ${email}`);

      return {
        user: loginResult.user,
        tokens: loginResult.tokens,
        message: "Registration successful!",
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Registration error: ${error.message}`);
      throw new UnauthorizedException("Registration failed: " + error.message);
    }
  }

  /**
   * Login user with Supabase Auth
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.warn(`Login failed for ${email}: ${error.message}`);
        throw new UnauthorizedException("Invalid email or password");
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException("Login failed - no session returned");
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name || email.split("@")[0],
        role: "user",
        lastLogin: new Date(),
      };

      const tokens: AuthTokens = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
      };

      this.logger.log(`User logged in successfully: ${email}`);

      return {
        user: authUser,
        tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login error: ${error.message}`);
      throw new UnauthorizedException("Login failed");
    }
  }

  /**
   * Refresh access token using Supabase
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Token refresh error: ${error.message}`);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await this.supabase.auth.signOut();
      this.logger.log("User logged out");
    } catch (error) {
      this.logger.warn(`Logout error: ${error.message}`);
    }
  }

  /**
   * Get user by ID from Supabase
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const { data, error } =
        await this.supabase.auth.admin.getUserById(userId);

      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        name:
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User",
        role: "user",
        lastLogin: new Date(data.user.last_sign_in_at || Date.now()),
      };
    } catch (error) {
      this.logger.error(`Get user error: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify JWT token with Supabase
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException("Token verification failed");
      }

      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
        role: "user",
      };
    } catch (error) {
      throw new UnauthorizedException("Token verification failed");
    }
  }

  /**
   * Request password reset via Supabase
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);

      if (error) {
        this.logger.warn(`Password reset error: ${error.message}`);
      }

      // Always return success to not reveal if email exists
      return {
        message: "If the email exists, instructions have been sent",
      };
    } catch (error) {
      this.logger.error(`Password reset error: ${error.message}`);
      return {
        message: "If the email exists, instructions have been sent",
      };
    }
  }

  /**
   * Update password via Supabase
   */
  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const { error } = await this.supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        throw new UnauthorizedException("Password update failed");
      }

      return {
        message: "Password updated successfully",
      };
    } catch (error) {
      this.logger.error(`Password update error: ${error.message}`);
      throw new UnauthorizedException("Password update failed");
    }
  }
}
