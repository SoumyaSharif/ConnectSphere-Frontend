import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Post } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class MockDataService {

  /* ─── Current logged-in user (mock) ─── */
  readonly currentUser: User = {
    userId: 'u1',
    username: 'cosmicexplorer',
    email: 'alex@connectsphere.io',
    fullName: 'Alex Starfield',
    bio: '🚀 Exploring the cosmos one post at a time | Software engineer | Coffee addict',
    profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmicexplorer&backgroundColor=7c3aed',
    website: 'https://alexstarfield.dev',
    role: 'USER',
    provider: 'LOCAL',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  };

  /* ─── Users ─── */
  readonly users: User[] = [
    this.currentUser,
    {
      userId: 'u2', username: 'nebula_nova', email: 'nova@cs.io', fullName: 'Nova Nebula',
      bio: '🌌 Astrophysics PhD | Galaxy hunter | Night sky photographer',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899',
      role: 'USER', provider: 'LOCAL', isActive: true, createdAt: '2024-02-01T09:00:00Z'
    },
    {
      userId: 'u3', username: 'stellar_ryan', email: 'ryan@cs.io', fullName: 'Ryan Stellar',
      bio: '⭐ Stargazer | Coder by day, dreamer by night',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stellarryan&backgroundColor=06b6d4',
      role: 'USER', provider: 'GOOGLE', isActive: true, createdAt: '2024-02-10T14:00:00Z'
    },
    {
      userId: 'u4', username: 'galaxy_girl', email: 'gal@cs.io', fullName: 'Galaxia Torres',
      bio: '💫 Artist & Dreamer | Making the universe beautiful one pixel at a time',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=galaxygirl&backgroundColor=f59e0b',
      role: 'USER', provider: 'LOCAL', isActive: true, createdAt: '2024-03-01T08:00:00Z'
    },
    {
      userId: 'u5', username: 'pulsar_pete', email: 'pete@cs.io', fullName: 'Pete Pulsar',
      bio: '🌠 Musician | Beatboxing across the cosmos',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pulsarpete&backgroundColor=7c3aed',
      role: 'USER', provider: 'LOCAL', isActive: true, createdAt: '2024-03-15T12:00:00Z'
    },
    {
      userId: 'u6', username: 'quasar_quinn', email: 'quinn@cs.io', fullName: 'Quinn Quasar',
      bio: '✨ Tech wizard | Building galaxies with code',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quasarquinn&backgroundColor=10b981',
      role: 'USER', provider: 'GOOGLE', isActive: true, createdAt: '2024-03-20T10:00:00Z'
    },
    {
      userId: 'u7', username: 'aurora_admin', email: 'admin@cs.io', fullName: 'Aurora Admin',
      bio: '🛡️ Platform Administrator | Keeping ConnectSphere safe and stellar',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=auroraadmin&backgroundColor=ef4444',
      role: 'ADMIN', provider: 'LOCAL', isActive: true, createdAt: '2024-01-01T00:00:00Z'
    },
    {
      userId: 'u8', username: 'void_vance', email: 'vance@cs.io', fullName: 'Vance Void',
      bio: '🔭 Telescope operator | Finding black holes for fun',
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=voidvance&backgroundColor=6b7280',
      role: 'USER', provider: 'LOCAL', isActive: false, createdAt: '2024-04-01T09:00:00Z'
    },
  ];

  /* ─── Posts ─── */
  readonly posts: Post[] = [
    {
      postId: 'p1', authorId: 'u2', content: '🌌 Just captured this breathtaking photo of the Andromeda galaxy last night! The cosmos never ceases to amaze me. Who else is a space enthusiast? #space #astronomy #astrophotography #cosmos',
      mediaUrls: ['https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600'],
      postType: 'MEDIA', visibility: 'PUBLIC', likesCount: 847, commentsCount: 42, sharesCount: 156,
      createdAt: new Date(Date.now() - 2*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'nebula_nova', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899', fullName: 'Nova Nebula' },
      hasLiked: false, userReaction: undefined
    },
    {
      postId: 'p2', authorId: 'u3', content: 'Hot take: The best debugging sessions happen at 3am when the whole world is asleep and only the stars are watching 🌟 Currently hunting down a cosmic memory leak in our distributed system. Send help. And coffee. #coding #devlife #debugging',
      mediaUrls: [],
      postType: 'TEXT', visibility: 'PUBLIC', likesCount: 523, commentsCount: 87, sharesCount: 201,
      createdAt: new Date(Date.now() - 5*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'stellar_ryan', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stellarryan&backgroundColor=06b6d4', fullName: 'Ryan Stellar' },
      hasLiked: true, userReaction: 'LIKE'
    },
    {
      postId: 'p3', authorId: 'u4', content: 'New digital art piece I\'ve been working on – "Nebula Dreams" 🎨✨ Drawing inspiration from the Pillars of Creation. This one took 40 hours to complete. What do you think? #digitalart #space #nebula #artwork #creative',
      mediaUrls: ['https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600'],
      postType: 'MEDIA', visibility: 'PUBLIC', likesCount: 1243, commentsCount: 134, sharesCount: 89,
      createdAt: new Date(Date.now() - 8*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'galaxy_girl', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=galaxygirl&backgroundColor=f59e0b', fullName: 'Galaxia Torres' },
      hasLiked: false, userReaction: undefined
    },
    {
      postId: 'p4', authorId: 'u1', content: 'ConnectSphere is live! 🚀 After months of building, our social platform is officially in beta. Deep space meets social media. Explore the cosmos with us! #connectsphere #launch #socialmedia #tech',
      mediaUrls: [],
      postType: 'TEXT', visibility: 'FOLLOWERS', likesCount: 389, commentsCount: 56, sharesCount: 44,
      createdAt: new Date(Date.now() - 12*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'cosmicexplorer', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmicexplorer&backgroundColor=7c3aed', fullName: 'Alex Starfield' },
      hasLiked: false, userReaction: undefined
    },
    {
      postId: 'p5', authorId: 'u5', content: '🎵 Wrote a new track inspired by pulsar rhythms – "Heartbeat of a Neutron Star". Nature\'s perfect metronome. Listen and let me know what you feel! #music #space #pulsars #electronica',
      mediaUrls: ['https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600'],
      postType: 'MEDIA', visibility: 'PUBLIC', likesCount: 692, commentsCount: 48, sharesCount: 112,
      createdAt: new Date(Date.now() - 18*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'pulsar_pete', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pulsarpete&backgroundColor=7c3aed', fullName: 'Pete Pulsar' },
      hasLiked: true, userReaction: 'LOVE'
    },
    {
      postId: 'p6', authorId: 'u6', content: 'Thread 🧵: Everything you need to know about building scalable microservices for a social platform. After 2 years working on distributed systems, here\'s what I\'ve learned. 1/ The CAP theorem is your best friend and worst enemy simultaneously… #microservices #tech #backend #distributed',
      mediaUrls: [],
      postType: 'TEXT', visibility: 'PUBLIC', likesCount: 2150, commentsCount: 310, sharesCount: 445,
      createdAt: new Date(Date.now() - 24*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'quasar_quinn', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quasarquinn&backgroundColor=10b981', fullName: 'Quinn Quasar' },
      hasLiked: false, userReaction: undefined
    },
    {
      postId: 'p7', authorId: 'u2', content: 'Solar storm alert! 🌞⚡ The sun is sending massive plasma ejections our way. Northern lights visible tonight across multiple continents! Get outside if you can. The sky is putting on a FREE cosmic show. #auroraborealis #solarstorm #space #northernlights',
      mediaUrls: ['https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600'],
      postType: 'MEDIA', visibility: 'PUBLIC', likesCount: 3891, commentsCount: 278, sharesCount: 1203,
      createdAt: new Date(Date.now() - 36*3600*1000).toISOString(), updatedAt: new Date().toISOString(),
      author: { username: 'nebula_nova', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899', fullName: 'Nova Nebula' },
      hasLiked: true, userReaction: 'WOW'
    },
  ];

  /* ─── Stories ─── */
  readonly stories = [
    { id: 's0', userId: 'u1', username: 'Your Story', isOwn: true, viewed: false,
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmicexplorer&backgroundColor=7c3aed' },
    { id: 's1', userId: 'u2', username: 'nebula_nova', isOwn: false, viewed: false,
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899' },
    { id: 's2', userId: 'u3', username: 'stellar_ryan', isOwn: false, viewed: false,
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stellarryan&backgroundColor=06b6d4' },
    { id: 's3', userId: 'u4', username: 'galaxy_girl', isOwn: false, viewed: true,
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=galaxygirl&backgroundColor=f59e0b' },
    { id: 's4', userId: 'u5', username: 'pulsar_pete', isOwn: false, viewed: false,
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pulsarpete&backgroundColor=7c3aed' },
    { id: 's5', userId: 'u6', username: 'quasar_quinn', isOwn: false, viewed: true,
      profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quasarquinn&backgroundColor=10b981' },
  ];

  /* ─── Notifications ─── */
  readonly notifications = [
    { id: 'n1', type: 'LIKE', actorUsername: 'nebula_nova', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899',
      message: 'liked your post about the Andromeda galaxy', postId: 'p1', isRead: false, createdAt: new Date(Date.now() - 10*60*1000).toISOString() },
    { id: 'n2', type: 'COMMENT', actorUsername: 'stellar_ryan', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stellarryan&backgroundColor=06b6d4',
      message: 'commented on your post: "This is absolutely incredible! 🚀"', postId: 'p4', isRead: false, createdAt: new Date(Date.now() - 25*60*1000).toISOString() },
    { id: 'n3', type: 'FOLLOW', actorUsername: 'galaxy_girl', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=galaxygirl&backgroundColor=f59e0b',
      message: 'started following you', isRead: false, createdAt: new Date(Date.now() - 2*3600*1000).toISOString() },
    { id: 'n4', type: 'LIKE', actorUsername: 'quasar_quinn', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quasarquinn&backgroundColor=10b981',
      message: 'loved your post about ConnectSphere launch', postId: 'p4', isRead: true, createdAt: new Date(Date.now() - 5*3600*1000).toISOString() },
    { id: 'n5', type: 'MENTION', actorUsername: 'pulsar_pete', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pulsarpete&backgroundColor=7c3aed',
      message: 'mentioned you in a comment', postId: 'p5', isRead: true, createdAt: new Date(Date.now() - 8*3600*1000).toISOString() },
    { id: 'n6', type: 'FOLLOW', actorUsername: 'stellar_ryan', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stellarryan&backgroundColor=06b6d4',
      message: 'started following you', isRead: true, createdAt: new Date(Date.now() - 24*3600*1000).toISOString() },
    { id: 'n7', type: 'COMMENT', actorUsername: 'nebula_nova', actorPic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899',
      message: 'replied to your comment: "Totally agree! 🌌"', postId: 'p1', isRead: true, createdAt: new Date(Date.now() - 2*24*3600*1000).toISOString() },
    { id: 'n8', type: 'SYSTEM', actorUsername: 'ConnectSphere', actorPic: '',
      message: 'Welcome to ConnectSphere! Explore the cosmos 🚀', isRead: true, createdAt: new Date(Date.now() - 7*24*3600*1000).toISOString() },
  ];

  /* ─── Trending Hashtags ─── */
  readonly trendingHashtags = [
    { tag: 'space',         postCount: 48200 },
    { tag: 'connectsphere', postCount: 23100 },
    { tag: 'astrophotography', postCount: 19500 },
    { tag: 'devlife',       postCount: 15800 },
    { tag: 'nebula',        postCount: 12300 },
    { tag: 'northernlights',postCount: 9870 },
    { tag: 'microservices', postCount: 7650 },
    { tag: 'digitalart',    postCount: 6420 },
    { tag: 'cosmos',        postCount: 5980 },
    { tag: 'astronomy',     postCount: 4510 },
  ];

  /* ─── Comments ─── */
  readonly comments = [
    { commentId: 'c1', postId: 'p1', authorId: 'u3', content: 'This is absolutely breathtaking! 🌌 The detail is incredible.', likesCount: 28, createdAt: new Date(Date.now() - 1*3600*1000).toISOString(),
      author: { username: 'stellar_ryan', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stellarryan&backgroundColor=06b6d4', fullName: 'Ryan Stellar' },
      replies: [
        { commentId: 'c1r1', parentId: 'c1', postId: 'p1', authorId: 'u2', content: 'Thank you so much! 💜 It was a perfect night for stargazing.', likesCount: 12, createdAt: new Date(Date.now() - 45*60*1000).toISOString(),
          author: { username: 'nebula_nova', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nebulanova&backgroundColor=ec4899' } }
      ]
    },
    { commentId: 'c2', postId: 'p1', authorId: 'u4', content: 'Andromeda is my absolute favourite. How long was the exposure?', likesCount: 15, createdAt: new Date(Date.now() - 1.5*3600*1000).toISOString(),
      author: { username: 'galaxy_girl', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=galaxygirl&backgroundColor=f59e0b', fullName: 'Galaxia Torres' },
      replies: []
    },
    { commentId: 'c3', postId: 'p2', authorId: 'u4', content: '3am debugging is a rite of passage 😂 sending virtual coffee ☕', likesCount: 45, createdAt: new Date(Date.now() - 4*3600*1000).toISOString(),
      author: { username: 'galaxy_girl', profilePicUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=galaxygirl&backgroundColor=f59e0b', fullName: 'Galaxia Torres' },
      replies: []
    },
  ];

  /* ─── Follow state ─── */
  readonly followingIds = new Set<string>(['u2', 'u3', 'u6']);
  readonly followerIds  = new Set<string>(['u2', 'u3', 'u4', 'u5', 'u6']);

  /* ─── Admin: User stats ─── */
  readonly adminStats = {
    totalUsers: 12847,
    activeUsers: 11203,
    totalPosts: 94321,
    totalComments: 423890,
    reportsToReview: 23,
    postsThisWeek: 3421,
    newUsersThisWeek: 287,
    engagementRate: 68.4,
  };

  readonly adminReports = [
    { id: 'r1', type: 'POST', targetId: 'p99', reason: 'Spam', reportedBy: 'stellar_ryan', status: 'PENDING', createdAt: new Date(Date.now() - 2*3600*1000).toISOString() },
    { id: 'r2', type: 'USER', targetId: 'u8', reason: 'Harassment', reportedBy: 'galaxy_girl', status: 'PENDING', createdAt: new Date(Date.now() - 5*3600*1000).toISOString() },
    { id: 'r3', type: 'COMMENT', targetId: 'c99', reason: 'Hate speech', reportedBy: 'nebula_nova', status: 'RESOLVED', createdAt: new Date(Date.now() - 24*3600*1000).toISOString() },
    { id: 'r4', type: 'POST', targetId: 'p98', reason: 'Misinformation', reportedBy: 'quasar_quinn', status: 'PENDING', createdAt: new Date(Date.now() - 36*3600*1000).toISOString() },
    { id: 'r5', type: 'USER', targetId: 'u9', reason: 'Fake account', reportedBy: 'pulsar_pete', status: 'DISMISSED', createdAt: new Date(Date.now() - 48*3600*1000).toISOString() },
  ];

  /* ─── Analytics chart data ─── */
  readonly analyticsData = {
    userGrowth:   [1200, 1450, 1890, 2100, 2340, 2780, 3100, 3450, 3890, 4210, 4650, 5100],
    postActivity: [4200, 5100, 4800, 6200, 5900, 7100, 6800, 7900, 8200, 7600, 9100, 9800],
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    topHashtags: [
      { tag: '#space', count: 48200 },
      { tag: '#devlife', count: 15800 },
      { tag: '#nebula', count: 12300 },
      { tag: '#digitalart', count: 6420 },
      { tag: '#cosmos', count: 5980 },
    ],
  };

  /* ─── Suggested Users ─── */
  getSuggestedUsers(): User[] {
    return this.users.filter(u => u.userId !== 'u1' && !this.followingIds.has(u.userId)).slice(0, 5);
  }

  /* ─── Profile posts by userId ─── */
  getPostsByUser(userId: string): Post[] {
    return this.posts.filter(p => p.authorId === userId);
  }

  /* ─── Search ─── */
  searchPosts(q: string): Post[] {
    const lq = q.toLowerCase();
    return this.posts.filter(p =>
      p.content.toLowerCase().includes(lq) ||
      p.author?.username.toLowerCase().includes(lq)
    );
  }

  searchUsers(q: string): User[] {
    const lq = q.toLowerCase();
    return this.users.filter(u =>
      u.username.toLowerCase().includes(lq) ||
      (u.fullName || '').toLowerCase().includes(lq)
    );
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)   return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d`;
    return `${Math.floor(diff/604800)}w`;
  }

  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
    if (n >= 1_000)     return (n/1_000).toFixed(1)+'K';
    return n.toString();
  }

  getInitials(name?: string, username?: string): string {
    const src = name || username || '?';
    return src.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  }
}
