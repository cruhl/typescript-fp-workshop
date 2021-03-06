import { Either, flow, List, Option, pipe, TaskEither } from "@morphism/fp";

// tslint:disable no-unused-expression

// Currying Functions

namespace Add {
  export const uncurried = (x: number, y: number): number => x + y;
  export const curried = (x: number) => (y: number): number => x + y;
  export const three = curried(3);
}

console.log(
  "1. ",
  Add.three(3),
  "===",
  Add.curried(3)(3),
  "===",
  Add.uncurried(3, 3),
  "\n"
);

// Function Composition with `pipe` and `flow`

namespace WordCount {
  export const usingPipe = (text: string): number =>
    pipe(text.split(" "), words => words.length);

  export const usingFlow: (text: string) => number = flow(
    text => text.split(" "),
    words => words.length
  );
}

console.log("2. ", WordCount.usingPipe("Four words are here"), "===", 4, "\n");
console.log("3. ", WordCount.usingFlow("Three words long"), "===", 3, "\n");

// Handling Nullability with `Option`

namespace Nullable {
  export const addThree = (
    x?: Option.Nullable<number>
  ): Option.Option<number> =>
    pipe(Option.fromNullable(x), Option.map(Add.three));
}

console.log("4.", Nullable.addThree(5), "===", Option.some(8), "\n");
console.log("5.", Nullable.addThree(), "===", Option.none, "\n");

const lie = [1, 2, 3, 4, 5][6];
console.log("6. ", lie + 4, "===", NaN, "\n");

const elementIsMissing = pipe(
  List.lookup(200, [1, 2, 3, 4, 5]),
  Option.getOrElse(() => 0),
  x => x + 4
);

console.log("7. ", elementIsMissing, "===", 4, "\n");

const elementExists = pipe(
  List.lookup(2, [1, 2, 3, 4, 5]),
  Option.map(x => x + 4),
  Option.getOrElse(() => 0)
);

console.log("8.", elementExists, "===", 7, "\n");

// Handling failure with `Either`

namespace Failure {
  export namespace StringOrBoolean {
    export type StringOrBoolean = Either.Either<string, boolean>;

    export const left: StringOrBoolean = Either.left("Lefty boi");
    export const right: StringOrBoolean = Either.right(false);
  }

  export namespace ErrorOrNumber {
    export type ErrorOrNumber =
      | Either.Either<Error, number> // Same as below
      | Either.ErrorOr<number>; // Same as above

    export const left: ErrorOrNumber = Either.left(Error("Yikes!"));
    export const right: ErrorOrNumber = Either.right(42);
  }

  export namespace Vibes {
    type Vibes = Either.Either<"bad", "good">;

    const unsafe = (vibes: Vibes): string | never => {
      if (Either.isLeft(vibes)) throw Error("bad vibes...");
      return "good vibes!";
    };

    const safe = (vibes: Vibes): Either.ErrorOr<string> =>
      Either.tryCatchError(() => unsafe(vibes));

    export const louder = (vibes: Vibes): string =>
      pipe(
        safe(vibes),
        Either.map(vibes => vibes.toUpperCase()),
        Either.mapLeft(error => error.message),
        Either.fold(
          badVibes => `Darn, ${badVibes}`,
          goodVibes => `We have some ${goodVibes}`
        )
      );
  }
}

console.log("9. ", Failure.Vibes.louder(Either.left("bad")), "\n");
console.log("10. ", Failure.Vibes.louder(Either.right("good")), "\n");

// `Either`s, `Option`s, and `chain`s, Oh My!

namespace NightClub {
  type Instruction = "Here's the line..." | "Time to party!";

  interface Patron {
    name: string;
    age: number;
    vipUntil?: Date;
  }

  export const bounce = (patron: Patron): Either.ErrorOr<Instruction> =>
    pipe(
      isOldEnough(patron),
      Either.mapLeft(yearsUntilLegal =>
        Error(`Come back in ${yearsUntilLegal} years!`)
      ),
      Either.chain(isBlacklisted),
      Either.map(instruction)
    );

  const isOldEnough = (patron: Patron): Either.Either<number, Patron> => {
    const yearsUntilLegal = 21 - patron.age;
    return yearsUntilLegal > 0
      ? Either.left(yearsUntilLegal)
      : Either.right(patron);
  };

  const isBlacklisted: (
    patron: Patron
  ) => Either.ErrorOr<Patron> = Either.fromPredicate(
    ({ name }) => !["Andy", "Todd"].includes(name),
    () => Error("Who do you think you are?")
  );

  const instruction = (patron: Patron): Instruction =>
    pipe(
      timeLeftAsVIP(patron),
      Option.chain(Option.fromPredicate(timeLeftAsVIP => timeLeftAsVIP > 0)),
      Option.fold(
        () => "Here's the line...",
        () => "Time to party!"
      )
    );

  const timeLeftAsVIP = (patron: Patron): Option.Option<number> =>
    pipe(
      Option.fromNullable(patron.vipUntil),
      Option.map(vipUntil => vipUntil.valueOf() - new Date().valueOf())
    );
}

console.log(
  "11. ",
  NightClub.bounce({
    name: "Conner",
    age: 23,
    vipUntil: new Date("December 11, 2045")
  }),
  NightClub.bounce({
    name: "Jay Smitty",
    age: 63
  }),
  NightClub.bounce({
    name: "Timmy",
    age: 8
  }),
  NightClub.bounce({
    name: "Andy",
    age: 23
  }),
  "\n"
);

namespace RussianRoulette {
  export const unsafe = async (player: string): Promise<string | never> =>
    new Promise((resolve, reject) => {
      setTimeout(
        () =>
          Math.random() > 1 / 6
            ? resolve(`${player} is safe...`)
            : reject(`${player} is dead!`),
        250
      );
    });

  export const safe = (player: string): TaskEither.ErrorOr<string> =>
    TaskEither.tryCatchError(() => unsafe(player));
}

(async () => {
  let roulette;
  try {
    roulette = await RussianRoulette.unsafe("Bob");
  } catch (error) {
    roulette = error;
  }

  console.log("12. ", roulette, "\n");
  console.log("13. ", await RussianRoulette.safe("Bob")(), "\n");
})();

(async () => {
  let loser = null;

  try {
    await RussianRoulette.unsafe("Conner");
    try {
      await RussianRoulette.unsafe("Brian");
      try {
        await RussianRoulette.unsafe("Andy");
      } catch (error) {
        loser = error;
      }
    } catch (error) {
      loser = error;
    }
  } catch (error) {
    loser = error;
  }

  if (!loser) loser = "Nobody dies!";

  console.log("14. ", loser, "\n");

  loser = await pipe(
    ["Conner", "Brian", "Andy"],
    List.map(RussianRoulette.safe),
    List.array.sequence(TaskEither.taskEither),
    TaskEither.map(() => "Nobody dies!")
  )();

  console.log("15. ", loser, "\n");
})();
