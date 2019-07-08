import { shape, string } from 'prop-types';

export default shape({
  hash: string.isRequired,
  pathname: string.isRequired,
  search: string.isRequired,
});
