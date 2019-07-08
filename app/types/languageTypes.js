import { shape, string } from 'prop-types';

export default shape({
  name: string.isRequired,
  code: string.isRequired,
  image: string.isRequired,
});
