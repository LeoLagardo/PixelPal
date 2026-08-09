import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PairingPage } from './pairing.page';
import { CompanionService } from '../services/companion.service';
import { Router } from '@angular/router';

describe('PairingPage', () => {
  let component: PairingPage;
  let fixture: ComponentFixture<PairingPage>;
  let mockCompanionService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockCompanionService = {
      pair: jasmine.createSpy('pair')
    };

    mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    await TestBed.configureTestingModule({
      imports: [PairingPage],
      providers: [
        { provide: CompanionService, useValue: mockCompanionService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PairingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with mode json', () => {
    expect(component.mode).toBe('json');
  });

  it('should toggle mode', () => {
    component.setMode('manual');
    expect(component.mode).toBe('manual');
    component.setMode('json');
    expect(component.mode).toBe('json');
  });

  it('should pair using raw JSON text field', fakeAsync(() => {
    component.rawJson = '{"ip": "192.168.1.10", "port": 8080, "token": "secret123", "name": "PC-Test"}';
    component.pairWithJson();

    expect(mockCompanionService.pair).toHaveBeenCalledWith('192.168.1.10', 8080, 'secret123', 'PC-Test');
    expect(component.showToast).toBeTrue();
    expect(component.toastMsg).toBe('Successfully Paired with PC!');

    tick(1001);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
  }));

  it('should handle invalid JSON on text field pairing', () => {
    component.rawJson = 'invalid-json';
    component.pairWithJson();

    expect(mockCompanionService.pair).not.toHaveBeenCalled();
    expect(component.showToast).toBeTrue();
    expect(component.toastMsg).toContain('Failed to parse JSON');
  });

  it('should mock start/stop scanning flow', fakeAsync(() => {
    // Mock getUserMedia
    const mockStream = {
      getTracks: () => [{ stop: jasmine.createSpy('stop') }]
    };
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(mockStream as any));

    component.startScanning();
    tick(100);

    expect(component.scanning).toBeTrue();

    component.stopScanning();
    expect(component.scanning).toBeFalse();
  }));

  it('should parse scanned QR code successfully', fakeAsync(() => {
    const qrData = '{"ip": "10.0.0.5", "port": 9000, "token": "qrtoken"}';

    // Call the private handleScannedCode method
    (component as any).handleScannedCode(qrData);

    expect(mockCompanionService.pair).toHaveBeenCalledWith('10.0.0.5', 9000, 'qrtoken', 'PC at 10.0.0.5');
    expect(component.showToast).toBeTrue();
    expect(component.toastMsg).toBe('Successfully Paired with PC!');

    tick(1001);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
  }));
});
