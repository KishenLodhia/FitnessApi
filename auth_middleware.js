const authorize = (req, res, next) => {
  const authorization = req.body.authorization;
  let token = null;

  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
    console.log("token: ", token);
  } else {
    console.log("token not found");
  }
};
