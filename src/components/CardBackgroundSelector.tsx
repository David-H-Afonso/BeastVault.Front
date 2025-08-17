import { CardBackgroundType, CardBackgroundLabels, type CardBackgroundTypeName } from '../enums/CardBackgroundTypes';
import { useCardBackgroundType } from '../hooks/useCardBackgroundType';
import './CardBackgroundSelector.scss';

export function CardBackgroundSelector() {
  const { backgroundType, setBackgroundType } = useCardBackgroundType();

  const backgroundOptions = Object.values(CardBackgroundType) as CardBackgroundTypeName[];

  return (
    <div className="card-background-selector">
      <label className="selector-label">Estilo de fondo de cards:</label>
      <select 
        value={backgroundType} 
        onChange={(e) => setBackgroundType(e.target.value as CardBackgroundTypeName)}
        className="background-selector"
      >
        {backgroundOptions.map((option) => (
          <option key={option} value={option}>
            {CardBackgroundLabels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
