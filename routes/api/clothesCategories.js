import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  const categories = [
    {
      name: "Dresses",
      image:
        "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
      name: "Tops",
      image:
        "https://images.pexels.com/photos/20303775/pexels-photo-20303775.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
      name: "Bottoms",
      image:
        "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
      name: "Intimate",
      image:
        "https://images.pexels.com/photos/15373662/pexels-photo-15373662.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
      name: "Jackets",
      image:
        "https://images.pexels.com/photos/16897756/pexels-photo-16897756.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
  ];
  res.json(categories);
});

export default router;
