import { classToPlain } from "class-transformer"

import { Sharable, Label, Node, Leaf } from "../Annotation";
import { createPlan } from "../Plan";

@Node()
class A {

    public constructor(init?: Partial<A>) {
        Object.assign(this, init);
    }

    a?: string
    @Sharable("Number of days")
    b?: number
}

const a = new A({ a: "bu", b: 3 })

test('plan:object/selective', () => {
    expect(classToPlain(createPlan(a, "label"))).toStrictEqual(
        {
            "classId": "A",
            "ids": {},
            "label": "label",
            "sharables": {
                "b": {
                    "enabled": false,
                    "label": "Number of days",
                    "value": 3,
                },
            },
        })
})

@Leaf()
class B {

    public constructor(init?: Partial<B>) {
        Object.assign(this, init);
    }

    a?: string
    @Sharable("Number of days")
    b?: number
}

const b = new B({ a: "bu", b: 3 })

test('plan:leaf', () => {
    expect(classToPlain(createPlan(b, "label"))).toStrictEqual(
        {
            "enabled": false,
            "label": "label",
            "value": {
                "a": "bu",
                "b": 3,
            }
        })
})

@Leaf()
class C {

    public constructor(init?: Partial<C>) {
        Object.assign(this, init);
    }

    a?: string

    @Label
    b?: string
}

const c = [new C({ a: "bu", b: "bulabel" }), new C({ a: "mu", b: "mulabel" })]

test('plan:array/label', () => {
    expect(classToPlain(createPlan(c, "label"))).toStrictEqual(
        {
            "label": "label",
            "sharables": [
                {
                    "enabled": false,
                    "label": "bulabel",
                    "value": {
                        "a": "bu",
                        "b": "bulabel"
                    },
                },
                {
                    "enabled": false,
                    "label": "mulabel",
                    "value": {
                        "a": "mu",
                        "b": "mulabel"
                    },
                },
            ],
        })
})
