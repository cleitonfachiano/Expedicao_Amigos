import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* O Topbar por página vai dentro das pages, ou aqui no futuro */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
