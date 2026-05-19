import { describe, it, expect } from 'vitest';
import { createContact } from '../crm/Contact';
import { createOpportunity } from '../crm/Opportunity';
import { createPipeline } from '../crm/Pipeline';
import { createCampaign } from '../crm/Campaign';

describe('CRMContact', () => {
  it('debe crear contacto con providerIds vacíos por default', () => {
    const contact = createContact({ name: 'Juan Pérez' });
    expect(contact.name).toBe('Juan Pérez');
    expect(contact.providerIds).toEqual({});
    expect(contact.tags).toEqual([]);
    expect(contact.metadata).toEqual({});
  });

  it('debe separar id canónico de providerIds', () => {
    const contact = createContact({
      id: 'cnt_01JX2K5N8P3Q' as never,
      providerIds: {
        ghl: 'ghl_contact_123',
        chatwoot: 'cw_456',
        whatsapp: '+5215500000001',
      },
    });

    expect(contact.id).toBe('cnt_01JX2K5N8P3Q');
    expect(contact.providerIds.ghl).toBe('ghl_contact_123');
    expect(contact.providerIds.chatwoot).toBe('cw_456');
    expect(contact.providerIds.whatsapp).toBe('+5215500000001');
  });

  it('debe aceptar firstName y lastName por separado', () => {
    const contact = createContact({
      name: 'Dra. María López',
      firstName: 'María',
      lastName: 'López',
    });

    expect(contact.firstName).toBe('María');
    expect(contact.lastName).toBe('López');
    expect(contact.name).toBe('Dra. María López');
  });

  it('debe aceptar email y phone', () => {
    const contact = createContact({
      name: 'Paciente',
      email: 'paciente@email.com',
      phone: '+525512345678',
      source: 'whatsapp',
    });

    expect(contact.email).toBe('paciente@email.com');
    expect(contact.phone).toBe('+525512345678');
    expect(contact.source).toBe('whatsapp');
  });

  it('metadata debe ser extensible', () => {
    const contact = createContact({
      name: 'Test',
      metadata: { edad: 35, seguro: 'GNP', ultimoTratamiento: 'limpieza' },
    });

    expect(contact.metadata.edad).toBe(35);
    expect(contact.metadata.seguro).toBe('GNP');
  });
});

describe('CRMOpportunity', () => {
  it('debe crear opportunity con valores defaults', () => {
    const opp = createOpportunity();
    expect(opp.status).toBe('open');
    expect(opp.providerIds).toEqual({});
    expect(opp.stageId).toBe('');
  });

  it('debe enlazar a contact y pipeline', () => {
    const opp = createOpportunity({
      id: 'opp_001' as never,
      contactId: 'cnt_c1' as never,
      pipelineId: 'pip_dental' as never,
      stageId: 'stage_consulta',
    });

    expect(opp.contactId).toBe('cnt_c1');
    expect(opp.pipelineId).toBe('pip_dental');
    expect(opp.stageId).toBe('stage_consulta');
  });

  it('debe aceptar valor monetario', () => {
    const opp = createOpportunity({
      value: 15000,
      currency: 'MXN',
      status: 'won',
    });

    expect(opp.value).toBe(15000);
    expect(opp.currency).toBe('MXN');
    expect(opp.status).toBe('won');
  });

  it('debe tener providerIds separados', () => {
    const opp = createOpportunity({
      providerIds: { ghl: 'ghl_opp_789' },
    });
    expect(opp.providerIds.ghl).toBe('ghl_opp_789');
  });
});

describe('CRMPipeline', () => {
  it('debe crear pipeline con stages vacíos', () => {
    const pipeline = createPipeline({ name: 'Dental Sales' });
    expect(pipeline.name).toBe('Dental Sales');
    expect(pipeline.stages).toEqual([]);
    expect(pipeline.active).toBe(true);
  });

  it('debe definir stages ordenados', () => {
    const pipeline = createPipeline({
      id: 'pip_dental' as never,
      name: 'Dental Pipeline',
      stages: [
        { id: 's1', name: 'Nuevo Lead', order: 1, color: '#aaa' },
        { id: 's2', name: 'Consulta Programada', order: 2, color: '#0af' },
        { id: 's3', name: 'Tratamiento Aceptado', order: 3, color: '#0f0' },
        { id: 's4', name: 'Pagado', order: 4 },
      ],
    });

    expect(pipeline.stages).toHaveLength(4);
    expect(pipeline.stages[0].name).toBe('Nuevo Lead');
    expect(pipeline.stages[3].order).toBe(4);
  });
});

describe('CRMCampaign', () => {
  it('debe crear campaign draft por default', () => {
    const campaign = createCampaign({ name: 'Recordatorio Citas' });
    expect(campaign.name).toBe('Recordatorio Citas');
    expect(campaign.status).toBe('draft');
  });

  it('debe aceptar rango de fechas', () => {
    const start = Date.now();
    const end = start + 7 * 24 * 60 * 60 * 1000;

    const campaign = createCampaign({
      id: 'cmp_001' as never,
      name: 'Promo Limpieza',
      status: 'active',
      startAt: start,
      endAt: end,
    });

    expect(campaign.status).toBe('active');
    expect(campaign.startAt).toBe(start);
    expect(campaign.endAt).toBe(end);
  });

  it('providerIds debe soportar múltiples providers', () => {
    const campaign = createCampaign({
      providerIds: {
        ghl: 'ghl_cmp_abc',
        mailchimp: 'mc_def',
      },
    });
    expect(campaign.providerIds.ghl).toBe('ghl_cmp_abc');
    expect(campaign.providerIds.mailchimp).toBe('mc_def');
  });
});
