import { cottage } from './cottage';
import { housingTiers } from './housingTiers';
import { type Recipes } from './lot';

export const housing: Recipes = {
  ...housingTiers,
  cottage,
};
