export interface Child {
    id: string;
    firstName: string;
    lastName?: string;
    birthDate: Date;
    gender: 'garçon' | 'fille' | 'other';
    schoolYear?: string;
    schoolName?: string;
    address?: string;
}

export interface Tip {
    id?: number;
    category: string;
    title: string;
    description: string;
    icon: string;
    color: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: 'user' | 'admin';
    created_at?: string;
    newPassword?: string;
    confirmPassword?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}
