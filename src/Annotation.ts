import "reflect-metadata"

const classStore: Map<string, Function> = new Map()

const sharableKey = Symbol("sharable_property")
const labelKey = Symbol("sharable_label")
const idKey = Symbol("sharable_id")
const nodeKey = Symbol("sharable_node")

/** @internal */
export class SharableProps {
    constructor(label: string, forceToLeaf: boolean) {
        this.label = label
        this.forceToLeaf = forceToLeaf
    }

    readonly label: string
    readonly forceToLeaf: boolean
}

/** @internal */
export class NodeProps<T> {

    /** @internal */
    constructor(
        id: string,
        leaf: boolean,
        serializeFn?: (o: T) => any,
        deserializeFn?: (o: any) => T
    ) {
        this.id = id
        this.leaf = leaf
    }

    readonly id: string
    readonly leaf: boolean
    readonly serializeFn?: (o: T) => any
    readonly deserializeFn?: (o: any) => T
}

export function Node<T extends Function>(classId?: string) {
    return function (target: T) {
        let id = classId ?? target.name
        Reflect.defineMetadata(nodeKey, new NodeProps(id, false), target)
        classStore.set(id, target)
    }
}

export function Leaf<T extends Function>(
    classId?: string,
    serializeFn?: (o: T) => any,
    deserializeFn?: (o: any) => T
) {
    return function (target: T) {
        let id = classId ?? target.name
        Reflect.defineMetadata(nodeKey, new NodeProps(id, true, serializeFn, deserializeFn), target)
        classStore.set(id, target)
    }
}

export function Sharable<T extends Object>(label?: string, forceToLeaf: boolean = false) {
    return function (
        target: T,
        propertyKey: string,
    ) {
        Reflect.defineMetadata(
            sharableKey,
            new SharableProps(label ?? propertyKey, forceToLeaf),
            target.constructor,
            propertyKey)
    }
}

export function Id<T extends Object>(
    target: T,
    propertyKey: string,
) {
    Reflect.defineMetadata(
        idKey,
        true,
        target.constructor,
        propertyKey)
}

export function Label<T extends Object>(
    target: T,
    propertyKey: string,
) {
    Reflect.defineMetadata(
        labelKey,
        true,
        target.constructor,
        propertyKey)
}

function getMetadata(key: any, obj: Function | Object, propertyKey: string) {
    if (obj !== null && typeof obj === "object") {
        return Reflect.getMetadata(key, obj.constructor, propertyKey)
    }
    else if (obj !== null && typeof obj === "function") {
        return Reflect.getMetadata(key, obj, propertyKey)
    }
    else {
        return undefined
    }
}

/** @internal */
export function isSharable(obj: Function | Object, propName: string) {
    return !!getMetadata(sharableKey, obj, propName)
}

/** @internal */
export function getSharableProps(obj: Function | Object, propName: string) {
    return getMetadata(sharableKey, obj, propName) as SharableProps
}

/** @internal */
export function isLabel(obj: Function | Object, propName: string) {
    return !!getMetadata(labelKey, obj, propName)
}

/** @internal */
export function isId(obj: Function | Object, propName: string) {
    return !!getMetadata(idKey, obj, propName)
}

/** @internal */
export function getNodeProps<T extends Object>(obj: T) {
    if (obj !== null && typeof obj === "object") {
        return Reflect.getMetadata(nodeKey, obj.constructor) as (NodeProps<T> | undefined)
    }
    else if (obj !== null && typeof obj === "function") {
        return Reflect.getMetadata(nodeKey, obj) as (NodeProps<T> | undefined)
    }
    else {
        return undefined
    }
}

/** @internal */
export function isNodeClass<T extends Object>(props: NodeProps<T> | undefined) {
    return !!props && !props.leaf
}

/** @internal */
export function getClassById(id: string) {
    return classStore.get(id)
}