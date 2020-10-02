import "reflect-metadata";

const classStore: Map<string, Function> = new Map()

const sharableKey = Symbol("sharable_property")
const titleKey = Symbol("sharable_id")
const idKey = Symbol("sharable_title")
const nodeKey = Symbol("sharable_node")

export class SharableProps {

    constructor(title: string, forceToLeaf: boolean)
    {
        this.title = title
        this.forceToLeaf = forceToLeaf
    }

    readonly title: string
    readonly forceToLeaf: boolean
}

export class NodeProps<T> {

    constructor(
        id: string, 
        leaf: boolean, 
        serializeFn?: (o: T) => any,
        deserializeFn?: (o: any) => T
        )
    {
        this.id = id
        this.leaf = leaf
    }

    readonly id: string
    readonly leaf: boolean
    readonly serializeFn?: (o: T) => any
    readonly deserializeFn?: (o: any) => T
}

export function Node<T extends Function>(id?: string) {
    return function (target: T) {
        let classId = id ?? target.name
        Reflect.defineMetadata(nodeKey, new NodeProps(classId, false), target)
        classStore.set(classId, target)
    }
};

// export, import
export function Leaf<T extends Function>(
        id?: string, 
        serializeFn?: (o: T) => any, 
        deserializeFn?: (o: any) => T
    ){
    return function (target: T) {
        let classId = id ?? target.name
        Reflect.defineMetadata(nodeKey, new NodeProps(id ?? target.name, true, serializeFn, deserializeFn), target)
        classStore.set(classId, target)
    }
};

export function Sharable<T>(as?: string, forceToLeaf: boolean = false) {
    return function (
      target: T,
      propertyKey: string,
    ) {
        Reflect.defineMetadata(
            sharableKey, 
            new SharableProps(as ?? propertyKey, forceToLeaf), 
            target, 
            propertyKey)
    };
}

export function Id<T>(
      target: T,
      propertyKey: string,
    ) {
    Reflect.defineMetadata(
        idKey, 
        true, 
        target, 
        propertyKey)
};

export function Title<T>(
      target: T,
      propertyKey: string,
    ) {
        Reflect.defineMetadata(
            titleKey, 
            true, 
            target, 
            propertyKey)
};

export function isSharable(obj: any, propName: string) {
    return !!Reflect.getMetadata(sharableKey, obj, propName)
}

export function getSharableProps(obj: any, propName: string) {
    return Reflect.getMetadata(sharableKey, obj, propName) as SharableProps
}

export function isTitle(obj: any, propName: string) {
    return Reflect.getMetadata(titleKey, obj, propName) ?? false
}

export function isId(obj: any, propName: string) {
    return Reflect.getMetadata(idKey, obj, propName) ?? false
}

export function getNodeProps<T extends Object>(obj: T)
{
    if(obj !== null && (typeof obj === "object" || typeof obj === "function"))
    {
        let nodeProps = Reflect.getMetadata(nodeKey, obj.constructor) 
        nodeProps = nodeProps ?? Reflect.getMetadata(nodeKey, obj)
        return nodeProps as (NodeProps<T> | undefined)
    }
    else
    {
        return undefined
    }
}

export function isNodeClass<T extends Object>(obj: T) {
    let props = getNodeProps(obj) 
    return !!props && !props.leaf
}

export function getClassById(id: string) {
    return classStore.get(id);
}