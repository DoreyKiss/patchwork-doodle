import { TestBed } from '@angular/core/testing';

import { RoomBaseService } from './room-base.service';

describe('RoomBaseService', () => {
    let service: RoomBaseService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RoomBaseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
