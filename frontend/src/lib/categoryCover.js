import CAKE from "../assets/category-covers/CAKE.png";
import CONSERVE from "../assets/category-covers/CONSERVE.png";
import DESSERT from "../assets/category-covers/DESSERT.png";
import ENTREE from "../assets/category-covers/ENTREE.png";
import MAIN from "../assets/category-covers/MAIN.png";
import SOUP from "../assets/category-covers/SOUP.png";
import STARTER from "../assets/category-covers/STARTER.png";
import SWEET from "../assets/category-covers/SWEET.png";
import DEFAULT from "../assets/category-covers/DEFAULT.png";

const MAP = {
  CAKE,
  CONSERVE,
  DESSERT,
  ENTREE,
  MAIN,
  SOUP,
  STARTER,
  SWEET,
};

export function getCategoryCover(category) {
  if (!category) return DEFAULT;
  return MAP[category] ?? DEFAULT;
}
