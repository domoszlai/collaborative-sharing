import { classToPlain } from "class-transformer"

import { Sharable, Id, Label, Node, Leaf } from "../Annotation";
import { createPlan } from "../Plan";

@Leaf("cid")
class C {
    public constructor(init?: Partial<C>) {
        Object.assign(this, init);
    }

    ca?: string
}

@Node("bid")
class B {

    public constructor(init?: Partial<B>) {
        Object.assign(this, init);
    }

    @Label
    ba?: string
    @Id
    bb?: number
    @Sharable("Bc")
    bc?: C
}

@Node("aid")
class A {

    public constructor(init?: Partial<A>) {
        Object.assign(this, init);
    }

    @Sharable("Ac")
    ac?: B[]
}

const a = new A(
    {
        ac: [
            new B({
                ba: "bu",
                bb: 2,
                bc: new C({ ca: "bubu" })
            }),
            new B({
                ba: "mu",
                bb: 1,
                bc: new C({ ca: "mumu" })
            })
        ]
    })

test('plan:object+array+leaf/label/id', () => {
    expect(classToPlain(createPlan(a, "label"))).toStrictEqual(
        {
            "classId": "aid",
            "ids": {},
            "label": "label",
            "sharables": {
                "ac": {
                    "label": "Ac",
                    "sharables": [
                        {
                            "classId": "bid",
                            "ids": { "bb": 2 },
                            "label": "bu",
                            "sharables": {
                                "bc": {
                                    "enabled": false,
                                    "label": "Bc",
                                    "value": {
                                        "ca": "bubu",
                                    },
                                },
                            },
                        },
                        {
                            "classId": "bid",
                            "ids": { "bb": 1 },
                            "label": "mu",
                            "sharables": {
                                "bc": {
                                    "enabled": false,
                                    "label": "Bc",
                                    "value": {
                                        "ca": "mumu",
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        }

    )
})
