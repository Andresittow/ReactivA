import { TestBed } from '@angular/core/testing';
import { VirtualLabComponent } from './virtual-lab';

describe('VirtualLabComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualLabComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should filter equipment reactively when searchControl changes', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.filteredEquipment.length).toBe(component.equipmentList.length);

    component.searchControl.setValue('Bunsen');
    expect(component.filteredEquipment.length).toBe(1);
    expect(component.filteredEquipment[0].name).toBe('Mechero Bunsen');

    component.searchControl.setValue('');
    expect(component.filteredEquipment.length).toBe(component.equipmentList.length);
  });

  it('should toggle equipment active state on click', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const burner = component.equipmentList.find(e => e.id === 'bunsen')!;
    const initialState = burner.active;

    component.toggleEquipment(burner);
    expect(burner.active).toBe(!initialState);
  });

  it('should validate the equation balance correctly for 2 H2 + 1 O2 -> 2 H2O', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isBalanced).toBe(false);

    component.coeffH2 = 2;
    component.coeffO2 = 1;
    component.coeffH2O = 2;
    component.evaluateEquationBalance();

    expect(component.isBalanced).toBe(true);
  });

  it('should reset the equation coefficients and status', () => {
    const fixture = TestBed.createComponent(VirtualLabComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.coeffH2 = 2;
    component.coeffO2 = 1;
    component.coeffH2O = 2;
    component.evaluateEquationBalance();
    expect(component.isBalanced).toBe(true);

    component.resetEquation();
    expect(component.coeffH2).toBeNull();
    expect(component.coeffO2).toBeNull();
    expect(component.coeffH2O).toBeNull();
    expect(component.isBalanced).toBe(false);
  });
});

