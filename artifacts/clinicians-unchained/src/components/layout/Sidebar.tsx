import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  FileText, 
  PlusCircle, 
  Settings,
  ShieldAlert,
  Stethoscope
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === '/' && location !== '/') return false;
    if (href !== '/' && location.startsWith(href)) return true;
    return location === href;
  };

  const NavItem = ({ href, icon: Icon, label }: SidebarItemProps) => (
    <Link href={href} className="block">
      <div 
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
          isActive(href) 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
        data-testid={`nav-${label.toLowerCase()}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </div>
    </Link>
  );

  return (
    <div className="flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-full">
      <div className="p-4 md:p-6 border-b border-sidebar-border flex items-center gap-2">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight text-foreground leading-tight">Clinicians Unchained</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">AI Workflow Engine</p>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Overview
        </div>
        <NavItem href="/" icon={Activity} label="Dashboard" />
        
        <div className="mt-8 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workflows
        </div>
        <NavItem href="/prescriptions" icon={FileText} label="Prescriptions" />
        <NavItem href="/submit" icon={PlusCircle} label="Submit Rejection" />
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed">
          <Settings className="h-4 w-4" />
          Settings
        </div>
      </div>
    </div>
  );
}
