import Logo from "@/components/ui/Logo";
import AuthThemeToggle from "@/components/auth/AuthThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <AuthThemeToggle />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size={40} />
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} HyperFlow · AI-Powered Organization
        </p>
      </div>
    </div>
  );
}
