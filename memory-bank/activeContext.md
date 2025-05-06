# Active Context

## Current Focus

- **Implementing refactored editor components** with a clean architecture
- Maintaining a clear separation of concerns between specialized modules
- Creating an event-driven system for better component communication
- Improving maintainability through smaller, focused files

## Recent Changes

### Editor Refactoring

- Created a complete event system with `EditorEventTypes.ts` and `EditorEventBus.ts` singleton
- Refactored the monolithic `EditorEntityManager.ts` (1300+ lines) into specialized components:
  - `EntityCreator.ts` - Factory methods for creating different entity types
  - `EntitySelector.ts` - Selection and highlighting logic
  - `EntityDragHandler.ts` - Entity drag handling behavior
  - `EntityUpdater.ts` - Entity property update logic
  - `EntityManager.ts` - Core coordination between components
  - `KeyboardManager.ts` - Keyboard shortcut handling
  - `CameraPanManager.ts` - Camera movement and zoom controls
- Updated `EditorScene.ts` to use the new component architecture
- Modified `EditorLevelHandler.ts` to work with the event system
- Created standardized event types for consistent communication

## Next Steps

- Address linter errors and type safety issues in the refactored components
- Complete the UI components refactoring:
  - Break down `Inspector.ts` into smaller UI components
  - Create reusable UI controls
  - Improve component organization
- Update integration tests to work with the new component structure
- Clean up redundant code and improve error handling

## Active Decisions

- Using the singleton pattern for the `EditorEventBus` to simplify communication
- Adopting a composition-based architecture rather than inheritance
- Using TypeScript interfaces to ensure proper type safety
- Keeping related functionality together in specialized classes
- Ensuring all components properly clean up when destroyed

## Important Patterns and Preferences

- **Component-based architecture**: Focusing on specialized components with clear responsibilities
- **Event-driven communication**: Using events for loose coupling between components
- **Registry-based state sharing**: Using Phaser's registry for cross-component state
- **Defensive coding**: Adding proper error handling and fallbacks
- **Clean separation of concerns**: Each class has a single, well-defined purpose
- **Facade pattern**: The `EntityManager` presents a simplified interface to complex subsystems

## Learnings and Project Insights

- Large monolithic managers make maintenance and feature additions difficult
- Event-driven architecture enables better component isolation
- Clear separation of responsibilities improves code readability and testability
- Breaking down large files improves navigation and reduces merge conflicts
- Composition offers more flexibility than inheritance for component organization
- Singletons can be useful for services like event buses when used judiciously
