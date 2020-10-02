import {
    node, leaf, isNodeClass,
    sharable, isSharable, getSharableProps, SharableProps, 
    id, isId, 
    title, isTitle,
    getClassById } from "../Annotation";

class A1 {}
@leaf()
class B1 {}
@node()
class C1 {}

test('node/leaf', () => {
    expect(isNodeClass(new A1())).toBe(false);
    expect(isNodeClass(new B1())).toBe(false);
    expect(isNodeClass(new C1())).toBe(true);
});

class A2 {
    a1 = "a1"
    @sharable() 
    a2 = "a2"
    @sharable("A3")
    a3 = "a3"
    @sharable("A4", true)
    a4 = "a4"

    getA1() {}
    @sharable() 
    getA2() {}
    @sharable("A3")
    getA3() {}
    @sharable("A4", true)
    getA4() {}
}

test('sharable', () => {
    expect(isSharable(new A2(), "a1")).toBe(false);
    expect(getSharableProps(new A2(), "a1")).toBe(undefined);
    expect(isSharable(new A2(), "a2")).toBe(true);
    expect(getSharableProps(new A2(), "a2").title).toBe("a2");
    expect(getSharableProps(new A2(), "a2").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "a3")).toBe(true);
    expect(getSharableProps(new A2(), "a3").title).toBe("A3");
    expect(getSharableProps(new A2(), "a3").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "a4")).toBe(true);
    expect(getSharableProps(new A2(), "a4").title).toBe("A4");
    expect(getSharableProps(new A2(), "a4").forceToLeaf).toBe(true);

    expect(isSharable(new A2(), "getA1")).toBe(false);
    expect(getSharableProps(new A2(), "getA1")).toBe(undefined);
    expect(isSharable(new A2(), "getA2")).toBe(true);
    expect(getSharableProps(new A2(), "getA2").title).toBe("getA2");
    expect(getSharableProps(new A2(), "getA2").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "getA3")).toBe(true);
    expect(getSharableProps(new A2(), "getA3").title).toBe("A3");
    expect(getSharableProps(new A2(), "getA3").forceToLeaf).toBe(false);
    expect(isSharable(new A2(), "getA4")).toBe(true);
    expect(getSharableProps(new A2(), "getA4").title).toBe("A4");
    expect(getSharableProps(new A2(), "getA4").forceToLeaf).toBe(true);
});

class A3 {
    a1 = "a1"
    @title 
    a2 = "a2"
    @title
    getA3(){}
}

test('title', () => {
    expect(isTitle(new A3(), "a1")).toBe(false);
    expect(isTitle(new A3(), "a2")).toBe(true);
    expect(isTitle(new A3(), "getA3")).toBe(true);
});

class A4 {
    a1 = "a1"
    @id 
    a2 = "a2"
    @id
    getA3(){}
}

test('id', () => {
    expect(isId(new A4(), "a1")).toBe(false);
    expect(isId(new A4(), "a2")).toBe(true);
    expect(isId(new A4(), "getA3")).toBe(true);
});

class A5 {
    @sharable("A1")
    a1?: string
}

test('missing_property', () => {
    expect(Object.assign({}, new A5())).toStrictEqual({});
    expect(Object.assign({}, getSharableProps(new A5(), "a1"))).toStrictEqual({"forceToLeaf": false, "title": "A1"});
});

@node("a6")
class A6 { 
}
@leaf("b6")
class B6 {
}

test('store', () => {
    expect(getClassById("B1")).toBe(B1);
    expect(getClassById("C1")).toBe(C1);
    expect(getClassById("a6")).toBe(A6);
    expect(getClassById("b6")).toBe(B6);
});


