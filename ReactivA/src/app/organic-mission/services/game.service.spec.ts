import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

const storageKey = 'reactiva_mision_organica_progress';

describe('GameService: persistencia', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; }
    } satisfies Storage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('inicializa y reinicia el progreso en SSR sin acceder al almacenamiento', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const read = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage no disponible en servidor');
    });
    const write = vi.spyOn(window.localStorage, 'setItem');
    const service = TestBed.inject(GameService);
    service.resetProgress();
    expect(service.getTotalScore()).toBe(0);
    expect(service.getProgress().levels.length).toBe(4);
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('restaura el progreso guardado en el navegador', () => {
    const service = TestBed.inject(GameService);
    service.getProgress().totalScore = 125;
    service.saveProgress();
    TestBed.resetTestingModule();
    expect(TestBed.inject(GameService).getTotalScore()).toBe(125);
  });

  it('recupera el estado inicial ante JSON inválido', () => {
    window.localStorage.setItem(storageKey, '{invalid');
    expect(TestBed.inject(GameService).getTotalScore()).toBe(0);
  });

  it('funciona en memoria cuando el almacenamiento está bloqueado', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    const service = TestBed.inject(GameService);
    expect(() => service.resetProgress()).not.toThrow();
    expect(service.getTotalScore()).toBe(0);
  });
});
