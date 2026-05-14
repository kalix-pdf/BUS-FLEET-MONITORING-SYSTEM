import { useState } from "react";
import { AdminLogin } from "./AdminLogin";

export function AdminFirstPage({ setRedirectToLogin }: { setRedirectToLogin: (value: boolean) => void }) {
    
    return (
        <main className="w-full max-h-screen relative overflow-hidden">
            <img src="/admin.jpg" alt="Admin Dashboard"
                className="w-full h-full object-cover scale-110 blur-sm brightness-60"/>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <img src="/admin-logo.png" alt="Logo" className="w-130 drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" />
                <button onClick={() => setRedirectToLogin(true)}
                    className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition">
                    Administrator Dashboard
                </button>
            </div>
        </main>
    );
}