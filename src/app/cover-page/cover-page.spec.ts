import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverPage } from './cover-page';

describe('CoverPage', () => {
  let component: CoverPage;
  let fixture: ComponentFixture<CoverPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CoverPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoverPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
