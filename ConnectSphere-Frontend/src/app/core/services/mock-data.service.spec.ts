import { TestBed } from '@angular/core/testing';
import { MockDataService } from './mock-data.service';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDataService);
  });

  it('returns suggested users excluding the current user and followed users', () => {
    const suggestions = service.getSuggestedUsers();

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every(user => user.userId !== 'u1')).toBe(true);
    expect(suggestions.every(user => !service.followingIds.has(user.userId))).toBe(true);
  });

  it('filters posts by author id', () => {
    const posts = service.getPostsByUser('u2');

    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every(post => post.authorId === 'u2')).toBe(true);
  });

  it('searches posts by content and author username case-insensitively', () => {
    expect(service.searchPosts('andromeda')[0].postId).toBe('p1');
    expect(service.searchPosts('STELLAR_RYAN')[0].postId).toBe('p2');
  });

  it('searches users by username and full name case-insensitively', () => {
    expect(service.searchUsers('nebula')[0].userId).toBe('u2');
    expect(service.searchUsers('galaxia')[0].userId).toBe('u4');
  });

  it('formats relative time for seconds, minutes, hours, days, and weeks', () => {
    const now = Date.now();

    expect(service.formatTimeAgo(new Date(now - 30_000).toISOString())).toBe('30s');
    expect(service.formatTimeAgo(new Date(now - 5 * 60_000).toISOString())).toBe('5m');
    expect(service.formatTimeAgo(new Date(now - 2 * 3_600_000).toISOString())).toBe('2h');
    expect(service.formatTimeAgo(new Date(now - 3 * 86_400_000).toISOString())).toBe('3d');
    expect(service.formatTimeAgo(new Date(now - 2 * 7 * 86_400_000).toISOString())).toBe('2w');
  });

  it('formats compact numbers for thousands and millions', () => {
    expect(service.formatNumber(999)).toBe('999');
    expect(service.formatNumber(1_500)).toBe('1.5K');
    expect(service.formatNumber(2_300_000)).toBe('2.3M');
  });

  it('builds initials from full name, username fallback, and default marker', () => {
    expect(service.getInitials('Alex Starfield')).toBe('AS');
    expect(service.getInitials(undefined, 'cosmic explorer')).toBe('CE');
    expect(service.getInitials()).toBe('?');
  });
});
