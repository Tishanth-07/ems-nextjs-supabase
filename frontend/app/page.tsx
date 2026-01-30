import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 dark:text-gray-100">
          Employee Management <span className="text-primary">System</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
          Streamline your workforce, manage payroll, and track performance with our comprehensive solution.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/auth/signin">
              Login <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/auth/signup">
              Create Account
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-12 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </div>
    </div>
  );
}
