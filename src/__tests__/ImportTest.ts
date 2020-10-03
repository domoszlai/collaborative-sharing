import { Type } from "class-transformer"

import { Sharable, Id, Label, Node, Leaf } from "../Annotation";
import { createPlan } from "../Plan";
import { importPlan } from "../Import";

@Node()
class Settings {

    owner?: string
    @Sharable("Number of days")
    nrDays?: number
}

class Ingredient {

    name?: string
    amount?: number
    unit?: string
}

@Leaf()
class Recipe {

    // when in array and node
    @Id
    id?: string
    // when in array and no titlefn
    // or root object and leaf?
    @Label
    name?: string;
    @Type(() => Ingredient)
    ingredients?: Ingredient[]
}

// what if the root object leaf?
// title of root object is always provided?
//@node(deserialize=)
@Node()
class Workspace {

    @Sharable("Settings")
    settings?: Settings

    @Sharable("Recipes")
    recipes?: Recipe[]

    @Sharable("Labels")
    labels?: string[]

    //    @sharable("Numbers")
    numbers?: number[]
}


// ?? shareChildren, whole, treatObjectAsValue

// @sharable && value => value -> value, propertyName -> title
// @sharable && object => sharable props -> sharable
// @sharable && array => elements: title -> title, 

const r1 = new Recipe()
r1.id = "id1"
r1.name = "bu1"
r1.ingredients = [new Ingredient()]

const r2 = new Recipe()
r2.id = "id2"
r2.name = "bu2"
r2.ingredients = [new Ingredient()]

const ws = new Workspace()
ws.settings = new Settings()
ws.settings.nrDays = 3
ws.recipes = [r1, r2]
//ws.labels = ["A","B"]
ws.numbers = [1, 2]

const t = new Map()
t.set("a", 1)

/*
test('property', () => {
    expect(makePlan(ws, "WS").serialize()).toBe("");
});
*/

const plan = createPlan(ws, "A")

test('property', () => {
    //expect(plan).toBe(deserializePlan(plan.serialize()));
    //expect(plan).toStrictEqual(deserializePlan(plan.export()));
    //expect(plan.export()).toStrictEqual({});
    expect(1).toStrictEqual(1);
});