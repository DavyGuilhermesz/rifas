import { Github, MessageCircle, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/40 backdrop-blur-xl glass-effect mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-gradient mb-1">Rifas</h3>
            <p className="text-sm text-muted-foreground">
              Sistema de Rifas Online
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://discord.com/users/zkawe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass-effect border border-primary/20 hover:border-primary/40 transition-all hover:scale-105 group"
            >
              <MessageCircle className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
              <span className="text-sm font-medium">Discord</span>
            </a>
            
            <a
              href="https://github.com/davyguilhermesz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass-effect border border-accent/20 hover:border-accent/40 transition-all hover:scale-105 group"
            >
              <Github className="h-5 w-5 text-accent group-hover:text-accent/80 transition-colors" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© 2025 Rifas</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Feito por Kawe
            </span>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-6 pt-6 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground">
            Todos os direitos reservados. Este sistema é protegido por direitos autorais.
          </p>
        </div>
      </div>
    </footer>
  );
}
