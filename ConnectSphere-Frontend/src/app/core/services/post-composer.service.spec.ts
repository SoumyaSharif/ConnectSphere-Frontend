import { TestBed } from '@angular/core/testing';
import { PostComposerService } from './post-composer.service';

describe('PostComposerService', () => {
  it('opens and closes the composer signal state', () => {
    const service = TestBed.inject(PostComposerService);

    expect(service.isOpen()).toBe(false);
    service.open();
    expect(service.isOpen()).toBe(true);
    service.close();
    expect(service.isOpen()).toBe(false);
  });
});
