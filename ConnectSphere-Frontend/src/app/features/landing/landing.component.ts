import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { gsap } from 'gsap';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('galaxyCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroSection') heroRef!: ElementRef;
  @ViewChild('navBar') navRef!: ElementRef;

  private ctx!: CanvasRenderingContext2D;
  private animFrameId!: number;
  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private particles: any[] = [];
  private time = 0;
  private resizeObserver!: ResizeObserver;

  stats = [
    { value: '10M+', label: 'Cosmic Travelers', icon: 'people' },
    { value: '50M+', label: 'Posts Launched', icon: 'rocket_launch' },
    { value: '99.9%', label: 'Orbital Uptime', icon: 'verified' },
    { value: '180+', label: 'Galaxies (Countries)', icon: 'public' }
  ];

  features = [
    {
      icon: 'auto_awesome',
      title: 'Cosmic Feed',
      description: 'Your personalized universe of content. AI-curated posts that resonate with your orbit.',
      gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)'
    },
    {
      icon: 'hub',
      title: 'Constellation Connect',
      description: 'Build your solar system of connections. Follow, collaborate, and grow your network across the cosmos.',
      gradient: 'linear-gradient(135deg, #ec4899, #7c3aed)'
    },
    {
      icon: 'live_tv',
      title: 'Nebula Stories',
      description: 'Share 24-hour ephemeral moments. Photos, videos, and polls that orbit your profile.',
      gradient: 'linear-gradient(135deg, #06b6d4, #7c3aed)'
    },
    {
      icon: 'explore',
      title: 'Galaxy Explore',
      description: 'Discover trending topics, hashtags, and creators across the ConnectSphere universe.',
      gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)'
    },
    {
      icon: 'notifications_active',
      title: 'Stellar Alerts',
      description: 'Real-time notifications for likes, follows, mentions — always in the loop across your universe.',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)'
    },
    {
      icon: 'security',
      title: 'Dark Matter Shield',
      description: 'Military-grade encryption and privacy controls. Your data stays within your gravitational field.',
      gradient: 'linear-gradient(135deg, #7c3aed, #06b6d4)'
    }
  ];

  testimonials = [
    {
      avatar: 'A',
      name: 'Aria Chen',
      handle: '@aria_cosmos',
      text: 'ConnectSphere completely changed how I connect with my audience. The cosmic UI is absolutely stunning — I feel like I\'m navigating the actual galaxy!',
      gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)'
    },
    {
      avatar: 'M',
      name: 'Marcus Nova',
      handle: '@m_nova_dev',
      text: 'The fastest, most beautiful social platform I\'ve ever used. The real-time features are out of this world. Literally.',
      gradient: 'linear-gradient(135deg, #06b6d4, #7c3aed)'
    },
    {
      avatar: 'S',
      name: 'Sofia Stellar',
      handle: '@sofia_stellar',
      text: 'I\'ve grown my following 10x since joining ConnectSphere. The explore feature helped me find my tribe across the universe!',
      gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)'
    }
  ];

  mobileMenuOpen = false;
  isBrowser = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.initCanvas();
    this.initStars();
    this.animate();
    this.initScrollAnimations();
    this.initParallax();

    // Entrance animations
    setTimeout(() => {
      gsap.fromTo('.hero-badge', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' });
      gsap.fromTo('.hero-headline', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' });
      gsap.fromTo('.hero-sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.4, ease: 'power3.out' });
      gsap.fromTo('.hero-cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: 'power3.out' });
      gsap.fromTo('.hero-social-proof', { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.8 });
      gsap.fromTo('.floating-card', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, stagger: 0.15, duration: 0.7, delay: 1.0, ease: 'back.out(1.7)' });
    }, 100);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(document.body);
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 2.5;
    this.initStars();
  }

  private initStars(): void {
    const canvas = this.canvasRef.nativeElement;
    this.stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 4000);

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }

    // Init shooting stars
    this.shootingStars = [];
    for (let i = 0; i < 5; i++) {
      this.shootingStars.push(this.createShootingStar(canvas.width, canvas.height));
    }
  }

  private createShootingStar(w: number, h: number): ShootingStar {
    return {
      x: Math.random() * w,
      y: Math.random() * h * 0.5,
      length: Math.random() * 80 + 40,
      speed: Math.random() * 4 + 2,
      angle: Math.PI / 6 + Math.random() * (Math.PI / 12),
      opacity: 0,
      active: Math.random() > 0.7
    };
  }

  private animate(): void {
    this.time += 0.016;
    this.drawGalaxy();
    this.animFrameId = requestAnimationFrame(() => this.animate());
  }

  private drawGalaxy(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#020409');
    bgGrad.addColorStop(0.3, '#060b14');
    bgGrad.addColorStop(0.7, '#080f1e');
    bgGrad.addColorStop(1, '#020409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebula clouds
    this.drawNebula(ctx, canvas.width * 0.15, canvas.height * 0.12, 300, 'rgba(124, 58, 237, 0.07)');
    this.drawNebula(ctx, canvas.width * 0.85, canvas.height * 0.08, 250, 'rgba(236, 72, 153, 0.06)');
    this.drawNebula(ctx, canvas.width * 0.5, canvas.height * 0.35, 350, 'rgba(6, 182, 212, 0.04)');
    this.drawNebula(ctx, canvas.width * 0.2, canvas.height * 0.55, 280, 'rgba(168, 85, 247, 0.05)');
    this.drawNebula(ctx, canvas.width * 0.8, canvas.height * 0.65, 220, 'rgba(236, 72, 153, 0.05)');

    // Galaxy spiral (center)
    this.drawGalaxySpiral(ctx, canvas.width * 0.75, canvas.height * 0.15);

    // Stars
    this.stars.forEach(star => {
      const twinkle = Math.sin(this.time * star.speed * 60 + star.twinkleOffset);
      const opacity = star.opacity * (0.6 + twinkle * 0.4);

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

      // Star color variety
      const hue = Math.floor((star.x * 0.1 + star.y * 0.05) % 60);
      ctx.fillStyle = `hsla(${260 + hue}, 80%, 90%, ${opacity})`;
      ctx.fill();

      // Glow for larger stars
      if (star.radius > 1.2) {
        const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 4);
        grd.addColorStop(0, `hsla(${260 + hue}, 80%, 90%, ${opacity * 0.3})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Shooting stars
    this.shootingStars.forEach(ss => {
      if (!ss.active) {
        if (Math.random() < 0.003) {
          ss.active = true;
          ss.x = Math.random() * canvas.width;
          ss.y = Math.random() * canvas.height * 0.4;
          ss.opacity = 0;
        }
        return;
      }

      ss.opacity = Math.min(1, ss.opacity + 0.05);
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;

      const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
      grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (ss.x > canvas.width + 100 || ss.y > canvas.height + 100) {
        ss.active = false;
      }
    });
  }

  private drawNebula(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGalaxySpiral(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const t = this.time * 0.05;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t);

    for (let arm = 0; arm < 3; arm++) {
      const armAngle = (arm * Math.PI * 2) / 3;
      for (let i = 0; i < 60; i++) {
        const angle = armAngle + i * 0.15;
        const r = i * 1.8;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const alpha = (1 - i / 60) * 0.25;
        const size = (1 - i / 60) * 1.5 + 0.3;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private initScrollAnimations(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
  }

  private initParallax(): void {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      gsap.to('.parallax-slow', { x: x * 15, y: y * 10, duration: 1, ease: 'power2.out' });
      gsap.to('.parallax-fast', { x: x * 30, y: y * 20, duration: 0.8, ease: 'power2.out' });
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }
}
