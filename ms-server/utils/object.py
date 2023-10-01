class ClassHierarchyMeta(type):
  
  def __init__(cls, name, bases, attrs):
    super().__init__(name, bases, attrs)
    cls.class_hierarchy = [cls.__name__] 

    for base in bases:
      if hasattr(base, 'class_hierarchy'):
        cls.class_hierarchy.extend(base.class_hierarchy)