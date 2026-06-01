import * as druid from "@saehrimnir/druidjs";

export function getExampleLDA() {
  //you likely want to preprocess the data and load it in from the server.
  let numberData = [
    [1, 3, 3, 4, 5],
    [1, 2, 3, 24, 5],
    [1, 24, 3, 4, 2],
    [1, 2, 36, 5, 5],
    [1, 21, 3, 4, 5],
    [12, 2, 3, 7, 5]
  ]

  let classes = ["a", "a", "b", "b", "a", "a"]

  const X = druid.Matrix.from(numberData); // X is the data as object of the Matrix class.

  //https://saehm.github.io/DruidJS/LDA.html
  const reductionLDA = new druid.LDA(X, { labels: classes, d: 2 }) //2 dimensions, can use more.
  const result = reductionLDA.transform()

  console.log(result.to2dArray) //convenience method: https://saehm.github.io/DruidJS/Matrix.html
};

