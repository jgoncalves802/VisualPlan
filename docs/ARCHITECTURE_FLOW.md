# VisionPlan - Fluxo de Dados e Arquitetura

## Diagrama de Fluxo Principal

```mermaid
flowchart TB
    subgraph USER["Usuario"]
        U1[Seleciona Projeto]
        U2[Navega para Pagina]
        U3[Edita Dados]
    end

    subgraph GLOBAL_STATE["Estado Global"]
        PS[useProjetoStore<br/>projetoSelecionado]
        AS[useAuthStore<br/>usuario/empresa]
    end

    subgraph PAGES["Paginas da Aplicacao"]
        subgraph CRONOGRAMA["Cronograma"]
            CP[CronogramaPage]
            ES[EpsSelector]
            GC[GanttChartV2]
        end
        
        subgraph TAKEOFF["Take-off"]
            TP[TakeoffPage]
            TM[TakeoffMapa]
            TI[TakeoffItens]
        end
        
        subgraph LPS["Last Planner System"]
            LP[LPSPage]
            PS_PAGE[ProgramacaoSemanalPage]
            CI[CheckInCheckOutPage]
        end
        
        subgraph RESTRICOES["Restricoes"]
            RP[RestricoesPage]
            IP[AnaliseIshikawaPage]
        end
    end

    subgraph STORES["Stores Zustand"]
        CS[useCronogramaStore<br/>projetoAtualId<br/>atividades<br/>dependencias]
        TS[useTakeoffStore<br/>selectedProjetoId<br/>itens/mapas]
        LS[useLPSStore<br/>programacoes]
        RS[useRestricoesStore<br/>restricoes]
    end

    subgraph SERVICES["Servicos"]
        CRS[cronogramaService]
        TKS[takeoffService]
        LPS_S[lpsService]
        RES[restricoesService]
        DIS[dataIntegrityService]
    end

    subgraph CACHE["Cache Layer"]
        CCS[cronogramaCacheService<br/>cache segregado por projetoId]
        LS_CACHE[localStorage]
    end

    subgraph DATABASE["Supabase Database"]
        DB[(PostgreSQL)]
        RLS[Row Level Security]
    end

    U1 --> PS
    U2 --> PAGES
    PS --> |projetoId| PAGES

    CP --> ES
    ES --> |onSelectProject| CS
    CS --> |carregarAtividades| CCS
    CCS --> |cache miss| CRS
    CRS --> DB
    DB --> RLS
    
    CS --> |dados carregados| GC
    CS --> |validacao| DIS
    DIS --> |auto-fix| CS

    TP --> TS
    TS --> TKS
    TKS --> DB

    LP --> LS
    LS --> LPS_S
    LPS_S --> DB

    RP --> RS
    RS --> RES
    RES --> DB

    style PS fill:#e3f2fd
    style CS fill:#e8f5e9
    style DIS fill:#fff3e0
    style CCS fill:#fce4ec
    style RLS fill:#f3e5f5
```

## Pontos Criticos de Isolamento de Dados

### 1. CronogramaStore - projetoAtualId
```typescript
projetoAtualId: string | null; // Rastreia projeto atual
carregarAtividades: async (projetoId: string) => {
  // CRITICAL: Limpa estado anterior antes de carregar novo projeto
  set({ 
    projetoAtualId: projetoId,
    atividades: [], // Limpa atividades anteriores
    dependencias: [], // Limpa dependencias
    caminhoCritico: null,
    isLoading: true 
  });
  // ... carrega dados do novo projeto
}
```

### 2. CronogramaCacheService - Segregacao por Projeto
```typescript
const getCacheKey = (type: string, ...ids: string[]): string => {
  return `${CACHE_PREFIX}${type}_${ids.join('_')}`;
  // Resultado: visionplan_cache_activities_PROJECT_ID
};
```

### 3. DataIntegrityService - Validacao Automatica
```typescript
validateProject(projetoId, activities, dependencies) {
  // Detecta atividades de outros projetos
  // Detecta dependencias orfas
  // Detecta parent_id invalidos
  // Auto-corrige problemas encontrados
}
```

## Fluxo de Troca de Projeto

```mermaid
sequenceDiagram
    participant U as Usuario
    participant PS as ProjetoStore
    participant CS as CronogramaStore
    participant CCS as CacheService
    participant DIS as DataIntegrityService
    participant DB as Supabase

    U->>PS: Seleciona novo projeto
    PS->>PS: setProjeto(novoProjeto)
    PS->>CS: Trigger via useEffect
    
    Note over CS: CRITICAL: Limpa estado anterior
    CS->>CS: set({ projetoAtualId, atividades: [], ... })
    
    CS->>CCS: getActivitiesFromCache(projetoId)
    alt Cache valido
        CCS-->>CS: Dados do cache
        CS->>CS: set({ atividades })
    else Cache expirado/vazio
        CS->>DB: getAtividades(projetoId)
        DB-->>CS: Atividades do projeto
        CS->>CCS: setActivitiesToCache(projetoId, atividades)
        CS->>CS: set({ atividades })
    end
    
    Note over DIS: Validacao automatica
    CS->>DIS: validateProject(projetoId, atividades, deps)
    DIS->>DIS: Detecta cross-project data
    alt Problemas encontrados
        DIS->>DIS: autoFixIssues()
        DIS-->>CS: Dados limpos
        CS->>CS: set({ atividades: cleaned })
    end
    
    CS-->>U: Interface atualizada
```

## Regras de Ouro para Isolamento de Dados

1. **Sempre rastrear o projeto atual** - Todos os stores devem ter uma propriedade `projetoAtualId` ou similar
2. **Limpar antes de carregar** - Ao trocar de projeto, SEMPRE limpar o estado anterior antes de carregar novos dados
3. **Validar apos carregar** - Usar DataIntegrityService para validar e auto-corrigir problemas
4. **Cache segregado** - Usar chaves de cache que incluem o projetoId
5. **RLS no banco** - Row Level Security garante isolamento no nivel do banco de dados
