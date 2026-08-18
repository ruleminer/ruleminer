import { ClassNodeDrawing, ConditionNodeDrawing, NodeDrawingStrategy, RuleNodeDrawing } from './drawing-strategy';

export class NodeFactory {
  static createDrawingStrategy(type: string, isChecked?: boolean, uuid?: string): NodeDrawingStrategy {
    switch (type) {
      case 'condition':
        return new ConditionNodeDrawing(isChecked, uuid);
      case 'class':
        return new ClassNodeDrawing();
      case 'rule':
        return new RuleNodeDrawing();
      default:
        throw new Error('Invalid node type');
    }
  }
}
