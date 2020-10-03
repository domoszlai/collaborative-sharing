import {
    Node, Leaf, isNodeClass, getNodeProps,
    Sharable, isSharable, getSharableProps, SharableProps,
    Id, isId,
    Label, isLabel,
    getClassById
} from "../Annotation";

class A1 { }
@Leaf("b1")
class B1 { }
@Node("c1")
class C1 { }

test('node/leaf obj', () => {
    expect(isNodeClass(new A1())).toBe(false);
    expect(isNodeClass(new B1())).toBe(false);
    expect(isNodeClass(new C1())).toBe(true);

    expect(getNodeProps(new A1())).toBe(undefined);
    expect(Object.assign({}, getNodeProps(new B1()))).toStrictEqual({ "id": "b1", "leaf": true });
    expect(Object.assign({}, getNodeProps(new C1()))).toStrictEqual({ "id": "c1", "leaf": false });
});

test('node/leaf class', () => {
    expect(isNodeClass(A1)).toBe(false);
    expect(isNodeClass(B1)).toBe(false);
    expect(isNodeClass(C1)).toBe(true);

    expect(getNodeProps(A1)).toBe(undefined);
    expect(Object.assign({}, getNodeProps(B1))).toStrictEqual({ "id": "b1", "leaf": true });
    expect(Object.assign({}, getNodeProps(C1))).toStrictEqual({ "id": "c1", "leaf": false });
});

class A2 {
    a1 = "a1"
    @Sharable()
    a2 = "a2"
    @Sharable("A3")
    a3 = "a3"
    @Sharable("A4", true)
    a4 = "a4"

    getA1() { }
    @Sharable()
    getA2() { }
    @Sharable("A3")
    getA3() { }
    @Sharable("A4", true)
    getA4() { }
}

test('sharable', () => {
    expect(isSharable(new A2(), "a1")).toBe(false);
    expect(getSharableProps(new A2(), "a1")).toBe(undefined);
    expect(isSharable(new A2(), "a2")).toBe(true);
    expect(getSharableProps(new A2(), "a2").label).toBe("a2");
    expect(getSharableProps(new A2(), "a2").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "a3")).toBe(true);
    expect(getSharableProps(new A2(), "a3").label).toBe("A3");
    expect(getSharableProps(new A2(), "a3").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "a4")).toBe(true);
    expect(getSharableProps(new A2(), "a4").label).toBe("A4");
    expect(getSharableProps(new A2(), "a4").forceToLeaf).toBe(true);

    expect(isSharable(new A2(), "getA1")).toBe(false);
    expect(getSharableProps(new A2(), "getA1")).toBe(undefined);
    expect(isSharable(new A2(), "getA2")).toBe(true);
    expect(getSharableProps(new A2(), "getA2").label).toBe("getA2");
    expect(getSharableProps(new A2(), "getA2").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "getA3")).toBe(true);
    expect(getSharableProps(new A2(), "getA3").label).toBe("A3");
    expect(getSharableProps(new A2(), "getA3").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "getA4")).toBe(true);
    expect(getSharableProps(new A2(), "getA4").label).toBe("A4");
    expect(getSharableProps(new A2(), "getA4").forceToLeaf).toBe(true);

    expect(isSharable(A2, "a1")).toBe(false);
    expect(isSharable(A2, "a2")).toBe(true);
});

class A3 {
    a1 = "a1"
    @Label
    a2 = "a2"
    @Label
    getA3() { }
}

test('label', () => {
    expect(isLabel(new A3(), "a1")).toBe(false);
    expect(isLabel(new A3(), "a2")).toBe(true);
    expect(isLabel(new A3(), "getA3")).toBe(true);

    expect(isLabel(A3, "a1")).toBe(false);
    expect(isLabel(A3, "a2")).toBe(true);
});

class A4 {
    a1 = "a1"
    @Id
    a2 = "a2"
    @Id
    getA3() { }
}

test('id', () => {
    expect(isId(new A4(), "a1")).toBe(false);
    expect(isId(new A4(), "a2")).toBe(true);
    expect(isId(new A4(), "getA3")).toBe(true);

    expect(isId(A4, "a1")).toBe(false);
    expect(isId(A4, "a2")).toBe(true);
});

class A5 {
    @Sharable("A1")
    a1?: string
}

test('missing_property', () => {
    expect(Object.assign({}, new A5())).toStrictEqual({});
    expect(Object.assign({}, getSharableProps(new A5(), "a1"))).toStrictEqual({ "forceToLeaf": false, "label": "A1" });
});

@Node("a6")
class A6 {
}
@Leaf("b6")
class B6 {
}

@Node()
class A7 { }
@Leaf()
class B7 { }

test('store', () => {
    expect(getClassById("A7")).toBe(A7);
    expect(getClassById("B7")).toBe(B7);
    expect(getClassById("a6")).toBe(A6);
    expect(getClassById("b6")).toBe(B6);
});
