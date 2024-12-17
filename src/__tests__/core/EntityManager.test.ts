import { EntityManager } from '../../core/EntityManager';
import { Entity } from '../../core/Entity';
import { Component, ComponentType } from '../../core/Component';

// Mock components for testing
class TestComponent extends Component {
  constructor() {
    super(ComponentType.TRANSFORM);
  }
}

class TestComponent2 extends Component {
  constructor() {
    super(ComponentType.RENDER);
  }
}

describe('EntityManager', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  it('should add and remove entities', () => {
    const entity = new Entity();
    
    // Add entity
    entityManager.addEntity(entity);
    expect(entityManager.getEntity(entity.id)).toBe(entity);

    // Remove entity
    entityManager.removeEntity(entity.id);
    expect(entityManager.getEntity(entity.id)).toBeUndefined();
  });

  it('should handle component groups correctly', () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    const entity3 = new Entity();

    // Add entities first
    entityManager.addEntity(entity1);
    entityManager.addEntity(entity2);
    entityManager.addEntity(entity3);

    // Add components
    const component1 = new TestComponent();
    const component2 = new TestComponent2();
    
    entity1.addComponent(component1);
    entity1.addComponent(component2);
    
    entity2.addComponent(new TestComponent());
    
    entity3.addComponent(new TestComponent2());

    // Verify component groups
    const transformGroup = entityManager.getEntitiesByComponent(ComponentType.TRANSFORM);
    const renderGroup = entityManager.getEntitiesByComponent(ComponentType.RENDER);

    expect(transformGroup.size).toBe(2);
    expect(renderGroup.size).toBe(2);
    expect(transformGroup.has(entity1)).toBe(true);
    expect(transformGroup.has(entity2)).toBe(true);
    expect(renderGroup.has(entity1)).toBe(true);
    expect(renderGroup.has(entity3)).toBe(true);

    // Remove component and verify group update
    entity1.removeComponent(ComponentType.TRANSFORM);
    expect(transformGroup.size).toBe(1);
    expect(transformGroup.has(entity1)).toBe(false);
    expect(transformGroup.has(entity2)).toBe(true);
  });

  it('should handle entity queries correctly', () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    const entity3 = new Entity();

    // Add entities and components
    entityManager.addEntity(entity1);
    entityManager.addEntity(entity2);
    entityManager.addEntity(entity3);

    entity1.addComponent(new TestComponent());
    entity1.addComponent(new TestComponent2());
    
    entity2.addComponent(new TestComponent());
    
    entity3.addComponent(new TestComponent2());

    // Query entities with both components
    const entities = entityManager.queryEntities(entity => 
      entity.hasComponent(ComponentType.TRANSFORM) && 
      entity.hasComponent(ComponentType.RENDER)
    );

    expect(entities.length).toBe(1);
    expect(entities[0]).toBe(entity1);

    // Query entities with either component
    const entitiesWithEither = entityManager.queryEntities(entity => 
      entity.hasComponent(ComponentType.TRANSFORM) || 
      entity.hasComponent(ComponentType.RENDER)
    );

    expect(entitiesWithEither.length).toBe(3);
  });

  it('should handle component lifecycle correctly', () => {
    const entity = new Entity();
    entityManager.addEntity(entity);

    // Add component
    const component = new TestComponent();
    entity.addComponent(component);

    // Verify component is in group
    const group = entityManager.getEntitiesByComponent(ComponentType.TRANSFORM);
    expect(group.has(entity)).toBe(true);

    // Remove entity and verify component cleanup
    entityManager.removeEntity(entity.id);
    expect(group.has(entity)).toBe(false);
    expect(entityManager.getEntitiesByComponent(ComponentType.TRANSFORM).size).toBe(0);
  });

  it('should handle mass entity operations efficiently', () => {
    const entities: Entity[] = [];
    
    // Create and add many entities
    for (let i = 0; i < 1000; i++) {
      const entity = new Entity();
      entityManager.addEntity(entity);
      entity.addComponent(new TestComponent());
      if (i % 2 === 0) {
        entity.addComponent(new TestComponent2());
      }
      entities.push(entity);
    }

    // Verify initial counts
    expect(entityManager.getEntitiesByComponent(ComponentType.TRANSFORM).size).toBe(1000);
    expect(entityManager.getEntitiesByComponent(ComponentType.RENDER).size).toBe(500);

    // Remove half the entities
    for (let i = 0; i < 500; i++) {
      entityManager.removeEntity(entities[i].id);
    }

    // Verify updated counts
    expect(entityManager.getEntitiesByComponent(ComponentType.TRANSFORM).size).toBe(500);
    expect(entityManager.getEntitiesByComponent(ComponentType.RENDER).size).toBe(250);

    // Cleanup all entities
    entityManager.cleanup();

    // Verify all groups are empty
    expect(entityManager.getEntitiesByComponent(ComponentType.TRANSFORM).size).toBe(0);
    expect(entityManager.getEntitiesByComponent(ComponentType.RENDER).size).toBe(0);
  });

  it('should handle entity reactivation correctly', () => {
    const entity = new Entity();
    entityManager.addEntity(entity);
    entity.addComponent(new TestComponent());

    // Deactivate entity
    entity.setActive(false);
    expect(entity.isActive()).toBe(false);

    // Component group should still contain the entity
    expect(entityManager.getEntitiesByComponent(ComponentType.TRANSFORM).has(entity)).toBe(true);

    // Reactivate entity
    entity.setActive(true);
    expect(entity.isActive()).toBe(true);
    expect(entityManager.getEntitiesByComponent(ComponentType.TRANSFORM).has(entity)).toBe(true);
  });

  it('should prevent duplicate entity additions', () => {
    const entity = new Entity();
    entityManager.addEntity(entity);
    
    // Attempt to add same entity again
    expect(() => entityManager.addEntity(entity)).toThrow();
  });

  it('should handle component updates correctly', () => {
    const entity = new Entity();
    entityManager.addEntity(entity);
    
    const component = new TestComponent();
    let updateCalled = false;
    
    // Override update method for testing
    component.update = (_: number) => {
      updateCalled = true;
    };

    entity.addComponent(component);
    entityManager.update(1/60);

    expect(updateCalled).toBe(true);
  });
}); 